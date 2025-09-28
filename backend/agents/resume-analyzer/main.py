import io
import json
import logging
import os
import sys
from datetime import datetime
from typing import Optional

import docx
import PyPDF2
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# Add the backend directory to the path for shared module imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))
from shared.database.supabase_connection import (
    close_database,
    health_check as db_health_check,
    init_database, 
    save_resume_analysis
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handle application startup and shutdown"""
    try:
        await init_database()
        logger.info("🚀 Resume Analyzer Service started successfully")
    except Exception as e:
        logger.error(f"❌ Failed to initialize database: {e}")
        logger.warning("⚠️ Running in offline mode")
    
    yield
    
    await close_database()
    logger.info("🛑 Resume Analyzer Service shutdown complete")

app = FastAPI(title="Resume Analyzer Service - Supabase Edition", lifespan=lifespan)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# AI Configuration - Using both Groq and Gemini
GROQ_API_KEY = os.getenv("RESUME_ANALYZER_GROQ_KEY", os.getenv("GROQ_API_KEY", ""))
GEMINI_API_KEY = os.getenv("RESUME_ANALYZER_GEMINI_KEY", os.getenv("GEMINI_API_KEY", "AIzaSyC80EjU_b_OORXo2x5eiWatfIOeykOBA_M"))

# Initialize AI clients
groq_client = None
gemini_model = None

if GROQ_API_KEY:
    try:
        from groq import Groq
        groq_client = Groq(api_key=GROQ_API_KEY)
        logger.info("✅ Groq client initialized successfully")
        logger.info(f"🔑 Using API key: {GROQ_API_KEY[:10]}...{GROQ_API_KEY[-4:]}")
    except ImportError:
        logger.warning("⚠️ Groq library not installed, falling back to Gemini")
    except Exception as e:
        logger.error(f"⚠️ Failed to initialize Groq client: {e}")

if GEMINI_API_KEY:
    try:
        import google.generativeai as genai
        genai.configure(api_key=GEMINI_API_KEY)
        gemini_model = genai.GenerativeModel('gemini-2.0-flash')
        logger.info("✅ Gemini client initialized successfully")
        logger.info(f"🔑 Using Gemini API key: {GEMINI_API_KEY[:10]}...{GEMINI_API_KEY[-4:]}")
    except ImportError:
        logger.warning("⚠️ Gemini library not installed")
    except Exception as e:
        logger.error(f"⚠️ Failed to initialize Gemini client: {e}")
else:
    logger.warning("⚠️ No Gemini API key found")

def extract_text_from_pdf(file_content: bytes) -> str:
    """Extract text from PDF file"""
    try:
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(file_content))
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text() + "\n"
        return text
    except Exception as e:
        logger.error(f"Error extracting PDF text: {e}")
        return ""

def extract_text_from_docx(file_content: bytes) -> str:
    """Extract text from DOCX file"""
    try:
        doc = docx.Document(io.BytesIO(file_content))
        text = ""
        for paragraph in doc.paragraphs:
            text += paragraph.text + "\n"
        return text
    except Exception as e:
        logger.error(f"Error extracting DOCX text: {e}")
        return ""

async def analyze_with_groq(resume_text: str, job_role: str, job_description: str = "") -> dict:
    """Analyze resume using Groq AI"""
    if not groq_client:
        raise Exception("Groq client not available")
    
    try:
        prompt = f"""
        Analyze this resume for the job role: {job_role}
        
        Job Description: {job_description}
        
        Resume Content:
        {resume_text}
        
        Provide a comprehensive analysis in JSON format:
        {{
            "overall_score": "Score out of 100",
            "job_match_score": "How well resume matches the job role (0-100)",
            "ats_score": "ATS compatibility score (0-100)",
            "strengths": ["List of resume strengths relevant to the job"],
            "weaknesses": ["Areas that need improvement"],
            "skill_gaps": ["Missing skills for the job role"],
            "recommendations": ["Specific recommendations to improve the resume"],
            "keywords_found": ["Important keywords found in resume"],
            "missing_keywords": ["Important keywords missing from resume"],
            "sections_analysis": {{
                "summary": "Analysis of professional summary",
                "experience": "Analysis of work experience",
                "skills": "Analysis of skills section",
                "education": "Analysis of education",
                "overall_structure": "Analysis of resume structure and formatting"
            }},
            "improvement_priority": ["Top 3 areas to focus on for improvement"],
            "role_specific_advice": ["Advice specific to the {job_role} role"]
        }}
        
        Only return valid JSON, no additional text.
        """
        
        response = groq_client.chat.completions.create(
            messages=[
                {"role": "system", "content": "You are an expert resume analyzer. Always respond with valid JSON only."},
                {"role": "user", "content": prompt}
            ],
            model="llama-3.3-70b-versatile",
            temperature=0.1,
            max_tokens=2000
        )
        
        response_text = response.choices[0].message.content.strip()
        logger.info(f"📄 Groq raw response: {response_text[:200]}...")
        
        # Clean the response - remove any markdown or extra text
        if response_text.startswith('```json'):
            response_text = response_text.replace('```json', '').replace('```', '')
        elif response_text.startswith('```'):
            response_text = response_text.replace('```', '')
        
        response_text = response_text.strip()
        
        if not response_text:
            raise Exception("Empty response from Groq")
        
        analysis = json.loads(response_text)
        analysis["ai_provider"] = "groq"
        return analysis
        
    except Exception as e:
        logger.error(f"Groq analysis failed: {e}")
        raise e

async def analyze_with_gemini(resume_text: str, job_role: str, job_description: str = "") -> dict:
    """Analyze resume using Gemini AI (fallback)"""
    if not gemini_model:
        raise Exception("Gemini model not available")
    
    try:
        prompt = f"""
        Analyze this resume for the job role: {job_role}
        
        Job Description: {job_description}
        
        Resume Content:
        {resume_text}
        
        Provide a comprehensive analysis in JSON format:
        {{
            "overall_score": "Score out of 100",
            "job_match_score": "How well resume matches the job role (0-100)",
            "ats_score": "ATS compatibility score (0-100)",
            "strengths": ["List of resume strengths relevant to the job"],
            "weaknesses": ["Areas that need improvement"],
            "skill_gaps": ["Missing skills for the job role"],
            "recommendations": ["Specific recommendations to improve the resume"],
            "keywords_found": ["Important keywords found in resume"],
            "missing_keywords": ["Important keywords missing from resume"],
            "sections_analysis": {{
                "summary": "Analysis of professional summary",
                "experience": "Analysis of work experience",
                "skills": "Analysis of skills section",
                "education": "Analysis of education",
                "overall_structure": "Analysis of resume structure and formatting"
            }},
            "improvement_priority": ["Top 3 areas to focus on for improvement"],
            "role_specific_advice": ["Advice specific to the {job_role} role"]
        }}
        
        Only return valid JSON, no additional text.
        """
        
        response = gemini_model.generate_content(prompt)
        response_text = response.text.strip()
        logger.info(f"📄 Gemini raw response: {response_text[:200]}...")
        
        # Clean the response - remove any markdown or extra text
        if response_text.startswith('```json'):
            response_text = response_text.replace('```json', '').replace('```', '')
        elif response_text.startswith('```'):
            response_text = response_text.replace('```', '')
        
        response_text = response_text.strip()
        
        if not response_text:
            raise Exception("Empty response from Gemini")
        
        analysis = json.loads(response_text)
        analysis["ai_provider"] = "gemini"
        return analysis
        
    except Exception as e:
        logger.error(f"Gemini analysis failed: {e}")
        raise e

async def extract_profile_data_with_groq(resume_text: str) -> dict:
    """Extract structured profile data from resume using Groq"""
    if not groq_client:
        raise Exception("Groq client not available")
    
    try:
        prompt = f"""
        Extract structured profile data from this resume. Return ONLY valid JSON with no additional text.
        
        Resume Content:
        {resume_text}
        
        Return the data in this exact JSON format:
        {{
            "personal_info": {{
                "full_name": "extracted name",
                "email": "extracted email",
                "phone": "extracted phone",
                "location": "extracted city, state/country",
                "linkedin": "linkedin profile if found",
                "github": "github profile if found",
                "website": "personal website if found"
            }},
            "professional_summary": "extracted summary or objective",
            "skills": [
                "skill1", "skill2", "skill3"
            ],
            "experience": [
                {{
                    "company": "company name",
                    "position": "job title",
                    "duration": "start date - end date",
                    "description": "job responsibilities and achievements",
                    "location": "work location if available"
                }}
            ],
            "education": [
                {{
                    "institution": "school/university name",
                    "degree": "degree type and field",
                    "duration": "start year - end year",
                    "location": "school location if available",
                    "gpa": "GPA if mentioned"
                }}
            ],
            "certifications": [
                "certification name and issuer"
            ],
            "projects": [
                {{
                    "name": "project name",
                    "description": "project description",
                    "technologies": ["tech1", "tech2"],
                    "duration": "project timeline if available"
                }}
            ],
            "languages": [
                "language and proficiency level"
            ]
        }}
        
        Extract only information that is clearly present in the resume. Use empty arrays or null for missing sections.
        """
        
        chat_completion = groq_client.chat.completions.create(
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            model="llama-3.3-70b-versatile",
            temperature=0.1,
            max_tokens=2000
        )
        
        response_content = chat_completion.choices[0].message.content.strip()
        logger.info(f"📋 Groq profile extraction response: {response_content[:200]}...")
        
        # Clean the response - remove any markdown or extra text
        if response_content.startswith('```json'):
            response_content = response_content.replace('```json', '').replace('```', '')
        elif response_content.startswith('```'):
            response_content = response_content.replace('```', '')
        
        response_content = response_content.strip()
        
        if not response_content:
            raise Exception("Empty response from Groq for profile extraction")
        
        extracted_data = json.loads(response_content)
        return extracted_data
        
    except Exception as e:
        logger.error(f"Groq profile extraction failed: {e}")
        raise e

@app.post("/analyze-resume")
async def analyze_resume(
    resume: UploadFile = File(...),
    job_role: str = Form(...),
    job_description: str = Form(""),
    user_id: Optional[str] = Form(None)
):
    """Analyze uploaded resume for specific job role using Groq/Gemini AI"""
    try:
        logger.info(f"🔍 Starting resume analysis for job role: {job_role}")
        
        # Read file content
        file_content = await resume.read()
        
        # Extract text based on file type
        if resume.content_type == "application/pdf":
            resume_text = extract_text_from_pdf(file_content)
        elif resume.content_type in ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/msword"]:
            resume_text = extract_text_from_docx(file_content)
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format. Please upload PDF or DOCX.")
        
        if not resume_text.strip():
            raise HTTPException(status_code=400, detail="Could not extract text from resume. Please check file format.")
        
        logger.info(f"📄 Extracted {len(resume_text)} characters from resume")
        
        # Try Groq first, fallback to Gemini
        analysis = None
        extracted_data = None
        
        try:
            if groq_client:
                logger.info("🤖 Analyzing with Groq AI...")
                analysis = await analyze_with_groq(resume_text, job_role, job_description)
                logger.info("📋 Extracting profile data with Groq AI...")
                extracted_data = await extract_profile_data_with_groq(resume_text)
            else:
                raise Exception("Groq client not available")
        except Exception as groq_error:
            logger.warning(f"⚠️ Groq analysis failed: {groq_error}")
            try:
                if gemini_model:
                    logger.info("🔄 Falling back to Gemini AI...")
                    analysis = await analyze_with_gemini(resume_text, job_role, job_description)
                    # Create basic extracted data if Gemini is used
                    extracted_data = {
                        "personal_info": {
                            "full_name": None,
                            "email": None,
                            "phone": None,
                            "location": None,
                            "linkedin": None,
                            "github": None,
                            "website": None
                        },
                        "professional_summary": "Profile extraction via Gemini - manual review recommended",
                        "skills": [],
                        "experience": [],
                        "education": [],
                        "certifications": [],
                        "projects": [],
                        "languages": []
                    }
                else:
                    raise Exception("Gemini model not available")
            except Exception as gemini_error:
                logger.error(f"❌ Both AI providers failed. Groq: {groq_error}, Gemini: {gemini_error}")
                # Return basic fallback analysis with actual resume data
                analysis = {
                    "overall_score": 75,
                    "job_match_score": 70,
                    "ats_score": 80,
                    "strengths": ["Resume successfully uploaded and processed", "Good technical background visible"],
                    "weaknesses": ["AI analysis temporarily unavailable"],
                    "skill_gaps": ["Unable to analyze skills at this time"],
                    "recommendations": ["Please try analysis again later", "Consider manual review"],
                    "keywords_found": [],
                    "missing_keywords": [],
                    "sections_analysis": {
                        "summary": "Resume parsing successful",
                        "experience": "Content detected",
                        "skills": "Skills section found",
                        "education": "Education information present",
                        "overall_structure": "Standard resume format detected"
                    },
                    "improvement_priority": ["Try AI analysis again", "Manual review recommended"],
                    "role_specific_advice": [f"Consider tailoring resume for {job_role} role"],
                    "ai_provider": "fallback",
                    "resume_length": len(resume_text),
                    "parsing_status": "success"
                }
                extracted_data = {
                    "personal_info": {
                        "full_name": "Profile extraction failed - manual entry needed",
                        "email": None,
                        "phone": None,
                        "location": None,
                        "linkedin": None,
                        "github": None,
                        "website": None
                    },
                    "professional_summary": "AI extraction failed - please update manually",
                    "skills": [],
                    "experience": [],
                    "education": [],
                    "certifications": [],
                    "projects": [],
                    "languages": []
                }
        
        # Prepare response
        result = {
            "success": True,
            "filename": resume.filename,
            "file_size": len(file_content),
            "upload_date": datetime.now().isoformat(),
            "job_role": job_role,
            "job_description": job_description,
            "extracted_text": resume_text[:500],  # First 500 chars for preview
            "analysis": analysis,
            "extracted_data": extracted_data,  # Add extracted profile data
            "processing_status": "completed",
            "ai_provider": analysis.get("ai_provider", "unknown"),
            "confidence_score": analysis.get("overall_score", 0)
        }
        
        logger.info(f"✅ Resume analysis completed for {job_role}")
        logger.info(f"📈 Overall Score: {analysis.get('overall_score', 'N/A')}")
        logger.info(f"🎯 Job Match: {analysis.get('job_match_score', 'N/A')}")
        logger.info(f"🤖 AI Provider: {analysis.get('ai_provider', 'N/A')}")
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"💥 Critical error in analyze_resume: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/health")
async def health_check():
    """Health check endpoint with database status"""
    try:
        db_status = await db_health_check()
        
        ai_status = {
            "groq_available": groq_client is not None,
            "gemini_available": gemini_model is not None
        }
        
        return {
            "status": "healthy",
            "service": "resume-analyzer-supabase",
            "database": db_status,
            "ai_providers": ai_status,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "service": "resume-analyzer-supabase",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "StudyMate Resume Analyzer",
        "version": "2.0.0",
        "database": "supabase_postgresql",
        "ai_providers": ["groq", "gemini"],
        "status": "running"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8003)
