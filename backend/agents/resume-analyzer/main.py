#!/usr/bin/env python3
"""
Enhanced StudyMate Resume Analyzer Service
Comprehensive AI-powered resume analysis with action words and STAR methodology scoring
"""

import os
import asyncio
import tempfile
import re
import json
from contextlib import asynccontextmanager
from datetime import datetime
from typing import Optional, Dict, List, Any

import asyncpg
from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from groq import Groq
import google.generativeai as genai
import PyPDF2
from docx import Document
import io
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv()

# Initialize clients
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(supabase_url, supabase_key) if supabase_url and supabase_key else None

groq_client = None
gemini_client = None
db_pool = None

# Initialize AI clients
try:
    groq_api_key = os.getenv("GROQ_API_KEY")
    if groq_api_key:
        groq_client = Groq(api_key=groq_api_key)
        print("✅ Groq client initialized")
    else:
        print("⚠️ GROQ_API_KEY not found")
except Exception as e:
    print(f"❌ Failed to initialize Groq client: {e}")

try:
    gemini_api_key = os.getenv("GEMINI_API_KEY")
    if gemini_api_key:
        genai.configure(api_key=gemini_api_key)
        gemini_client = genai.GenerativeModel('gemini-pro')
        print("✅ Gemini client initialized")
    else:
        print("⚠️ GEMINI_API_KEY not found")
except Exception as e:
    print(f"❌ Failed to initialize Gemini client: {e}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    global db_pool
    try:
        # Initialize database connection
        database_url = os.getenv("SUPABASE_DB_URL")
        if database_url:
            db_pool = await asyncpg.create_pool(database_url)
            print("✅ Database connection pool created")
        else:
            print("⚠️ SUPABASE_DB_URL not found")
    except Exception as e:
        print(f"❌ Failed to create database pool: {e}")
    
    yield
    
    # Cleanup
    if db_pool:
        await db_pool.close()

app = FastAPI(
    title="StudyMate Resume Analyzer Service",
    description="Enhanced AI-powered resume analysis with action words and STAR methodology scoring",
    version="2.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Utility functions
def extract_text_from_pdf(file_content: bytes) -> str:
    """Extract text from PDF file"""
    try:
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(file_content))
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text() + "\n"
        return text
    except Exception as e:
        print(f"PDF extraction error: {e}")
        return ""

def extract_text_from_docx(file_content: bytes) -> str:
    """Extract text from DOCX file"""
    try:
        doc = Document(io.BytesIO(file_content))
        text = ""
        for paragraph in doc.paragraphs:
            text += paragraph.text + "\n"
        return text
    except Exception as e:
        print(f"DOCX extraction error: {e}")
        return ""

async def get_action_verbs_reference() -> Dict[str, Any]:
    """Get action verbs reference data from database"""
    try:
        if not db_pool:
            return {}
        
        async with db_pool.acquire() as conn:
            rows = await conn.fetch("SELECT * FROM action_verbs_reference")
            return {row['verb'].lower(): {
                'category': row['category'],
                'strength_score': row['strength_score'],
                'alternatives': row['alternatives']
            } for row in rows}
    except Exception as e:
        print(f"Error getting action verbs reference: {e}")
        return {}

async def get_star_examples_reference() -> List[Dict[str, Any]]:
    """Get STAR examples reference data from database"""
    try:
        if not db_pool:
            return []
        
        async with db_pool.acquire() as conn:
            rows = await conn.fetch("SELECT * FROM star_examples_reference")
            return [dict(row) for row in rows]
    except Exception as e:
        print(f"Error getting STAR examples reference: {e}")
        return []

def analyze_action_verbs(text: str, action_verbs_ref: Dict[str, Any]) -> Dict[str, Any]:
    """Analyze action verbs in resume text"""
    words = re.findall(r'\b\w+\b', text.lower())
    found_verbs = []
    total_score = 0
    verb_categories = {}
    
    for word in words:
        if word in action_verbs_ref:
            verb_data = action_verbs_ref[word]
            found_verbs.append({
                'verb': word,
                'category': verb_data['category'],
                'strength_score': verb_data['strength_score'],
                'alternatives': verb_data['alternatives']
            })
            total_score += verb_data['strength_score']
            
            category = verb_data['category']
            if category not in verb_categories:
                verb_categories[category] = 0
            verb_categories[category] += 1
    
    # Calculate diversity score
    diversity_score = len(verb_categories) * 10 if verb_categories else 0
    
    # Calculate final score (0-100)
    final_score = min(100, (total_score * 2) + diversity_score)
    
    return {
        'score': final_score,
        'found_verbs': found_verbs,
        'categories': verb_categories,
        'total_verbs_found': len(found_verbs),
        'recommendations': generate_action_verb_recommendations(found_verbs, action_verbs_ref)
    }

def analyze_star_methodology(text: str, star_examples: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Analyze STAR methodology compliance in resume text"""
    lines = [line.strip() for line in text.split('\n') if line.strip() and len(line.strip()) > 20]
    bullet_points = [line for line in lines if line.startswith('•') or line.startswith('-') or line.startswith('*')]
    
    if not bullet_points:
        bullet_points = lines[:10]  # Take first 10 substantial lines
    
    star_scores = []
    total_score = 0
    
    for bullet in bullet_points:
        score = calculate_star_score(bullet)
        star_scores.append({
            'bullet': bullet,
            'star_score': score,
            'improvements': generate_star_improvements(bullet, star_examples)
        })
        total_score += score
    
    final_score = (total_score / len(bullet_points)) * 100 if bullet_points else 0
    
    return {
        'score': final_score,
        'bullet_analysis': star_scores,
        'recommendations': generate_star_recommendations(star_scores, star_examples)
    }

def calculate_star_score(bullet_text: str) -> float:
    """Calculate STAR methodology score for a single bullet point"""
    bullet_lower = bullet_text.lower()
    
    # Check for STAR components
    situation_indicators = ['when', 'during', 'while', 'in', 'for', 'at']
    task_indicators = ['responsible for', 'tasked with', 'needed to', 'required to']
    action_indicators = ['implemented', 'developed', 'created', 'led', 'managed', 'designed']
    result_indicators = ['resulting in', 'achieved', 'improved', 'increased', 'decreased', 'reduced']
    
    score = 0
    
    # Situation (25%)
    if any(indicator in bullet_lower for indicator in situation_indicators):
        score += 0.25
    
    # Task (25%)
    if any(indicator in bullet_lower for indicator in task_indicators):
        score += 0.25
    
    # Action (25%)
    if any(indicator in bullet_lower for indicator in action_indicators):
        score += 0.25
    
    # Result (25%)
    if any(indicator in bullet_lower for indicator in result_indicators) or any(char.isdigit() for char in bullet_text):
        score += 0.25
    
    return score

def generate_action_verb_recommendations(found_verbs: List[Dict], action_verbs_ref: Dict) -> List[str]:
    """Generate recommendations for improving action verbs"""
    recommendations = []
    
    if len(found_verbs) < 5:
        recommendations.append("Add more strong action verbs to your resume bullet points")
    
    weak_verbs = [v for v in found_verbs if v['strength_score'] < 4]
    if weak_verbs:
        recommendations.append(f"Consider replacing weak action verbs like '{', '.join([v['verb'] for v in weak_verbs[:3]])}' with stronger alternatives")
    
    categories = set([v['category'] for v in found_verbs])
    if len(categories) < 3:
        recommendations.append("Diversify your action verbs across different categories (Leadership, Technical, Creative, Analytical, Communication)")
    
    return recommendations

def generate_star_improvements(bullet: str, star_examples: List[Dict]) -> List[str]:
    """Generate STAR methodology improvements for a bullet point"""
    improvements = []
    
    if not any(char.isdigit() for char in bullet):
        improvements.append("Add quantifiable results with specific numbers or percentages")
    
    if 'achieved' not in bullet.lower() and 'resulted' not in bullet.lower():
        improvements.append("Include the outcome or result of your action")
    
    if len(bullet.split()) < 15:
        improvements.append("Expand with more context about the situation and your specific role")
    
    return improvements

def generate_star_recommendations(star_scores: List[Dict], star_examples: List[Dict]) -> List[str]:
    """Generate overall STAR methodology recommendations"""
    recommendations = []
    
    avg_score = sum([s['star_score'] for s in star_scores]) / len(star_scores) if star_scores else 0
    
    if avg_score < 0.5:
        recommendations.append("Most bullet points lack STAR methodology structure. Focus on Situation, Task, Action, and Result")
    
    if avg_score < 0.7:
        recommendations.append("Add more quantifiable results and specific outcomes to your achievements")
    
    recommendations.append("Use the CAR (Challenge, Action, Result) or STAR method for stronger impact statements")
    
    return recommendations

async def analyze_with_groq(resume_text: str, job_role: str, job_description: str = "") -> dict:
    """Enhanced analysis with Groq including action verbs and STAR methodology"""
    if not groq_client:
        raise HTTPException(status_code=500, detail="Groq client not initialized")
    
    # Get reference data
    action_verbs_ref = await get_action_verbs_reference()
    star_examples = await get_star_examples_reference()
    
    # Perform specialized analysis
    action_verb_analysis = analyze_action_verbs(resume_text, action_verbs_ref)
    star_analysis = analyze_star_methodology(resume_text, star_examples)
    
    prompt = f"""
    Analyze this resume for the position of {job_role}.
    Job Description: {job_description}

    Resume Text:
    {resume_text}

    Please provide a comprehensive analysis in JSON format with the following structure:
    {{
        "overall_score": <0-100>,
        "ats_score": <0-100>,
        "sections_analysis": {{
            "contact_info": {{"score": <0-100>, "feedback": ""}},
            "summary": {{"score": <0-100>, "feedback": ""}},
            "experience": {{"score": <0-100>, "feedback": ""}},
            "education": {{"score": <0-100>, "feedback": ""}},
            "skills": {{"score": <0-100>, "feedback": ""}}
        }},
        "recommendations": [
            "Specific recommendation 1",
            "Specific recommendation 2"
        ],
        "keyword_analysis": {{
            "matching_keywords": [],
            "missing_keywords": [],
            "keyword_density": <0-100>
        }},
        "formatting_feedback": ""
    }}
    """
    
    try:
        response = groq_client.chat.completions.create(
            messages=[
                {"role": "system", "content": "You are an expert resume analyzer. Provide detailed, actionable feedback in valid JSON format."},
                {"role": "user", "content": prompt}
            ],
            model="llama-3.1-70b-versatile",
            temperature=0.1,
            max_tokens=2000
        )
        
        analysis_text = response.choices[0].message.content
        
        try:
            groq_analysis = json.loads(analysis_text)
        except json.JSONDecodeError:
            groq_analysis = {
                "overall_score": 75,
                "ats_score": 70,
                "sections_analysis": {},
                "recommendations": ["Unable to parse detailed analysis"],
                "keyword_analysis": {"matching_keywords": [], "missing_keywords": [], "keyword_density": 0},
                "formatting_feedback": "Analysis parsing error"
            }
        
        # Combine with specialized analysis
        result = {
            **groq_analysis,
            "action_verb_analysis": action_verb_analysis,
            "star_analysis": star_analysis,
            "action_verb_score": action_verb_analysis['score'],
            "star_methodology_score": star_analysis['score']
        }
        
        return result
        
    except Exception as e:
        print(f"Groq analysis error: {e}")
        raise HTTPException(status_code=500, detail=f"Groq analysis failed: {str(e)}")

async def save_analysis_to_history(user_id: str, job_role: str, job_description: str, 
                                 file_name: str, file_path: str, analysis_results: dict) -> str:
    """Save analysis to history table"""
    try:
        if not db_pool:
            return ""
        
        async with db_pool.acquire() as conn:
            analysis_id = await conn.fetchval("""
                INSERT INTO resume_analysis_history 
                (user_id, job_role, job_description, file_name, file_path, analysis_results, 
                 action_verb_score, star_methodology_score, ats_score, overall_score, 
                 recommendations, line_by_line_analysis)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                RETURNING id
            """, 
            user_id, job_role, job_description, file_name, file_path, 
            json.dumps(analysis_results),
            analysis_results.get('action_verb_score', 0),
            analysis_results.get('star_methodology_score', 0),
            analysis_results.get('ats_score', 0),
            analysis_results.get('overall_score', 0),
            json.dumps(analysis_results.get('recommendations', [])),
            json.dumps(analysis_results.get('line_by_line_analysis', []))
            )
            
            return str(analysis_id)
    except Exception as e:
        print(f"Error saving analysis to history: {e}")
        return ""

# API Endpoints
@app.post("/analyze-resume")
async def analyze_resume(
    resume: UploadFile = File(...),
    job_role: str = Form(...),
    job_description: str = Form(""),
    user_id: Optional[str] = Form(None)
):
    """Enhanced resume analysis with action words and STAR methodology scoring"""
    
    if not resume.filename:
        raise HTTPException(status_code=400, detail="No file uploaded")
    
    # Validate file type
    allowed_types = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if resume.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Only PDF and DOCX files are supported")
    
    try:
        # Read file content
        file_content = await resume.read()
        
        # Extract text based on file type
        if resume.content_type == 'application/pdf':
            resume_text = extract_text_from_pdf(file_content)
        else:
            resume_text = extract_text_from_docx(file_content)
        
        if not resume_text.strip():
            raise HTTPException(status_code=400, detail="Could not extract text from the uploaded file")
        
        # Store file in Supabase storage
        file_path = ""
        if supabase and user_id:
            try:
                storage_path = f"{user_id}/{resume.filename}"
                supabase.storage.from_("analyzer-uploads").upload(storage_path, file_content)
                file_path = storage_path
            except Exception as e:
                print(f"Storage upload error: {e}")
        
        # Perform enhanced analysis
        analysis_results = await analyze_with_groq(resume_text, job_role, job_description)
        
        # Save to history
        analysis_id = ""
        if user_id:
            analysis_id = await save_analysis_to_history(
                user_id, job_role, job_description, resume.filename, 
                file_path, analysis_results
            )
        
        return {
            "status": "success",
            "analysis_id": analysis_id,
            "analysis": analysis_results,
            "extracted_text": resume_text[:1000] + "..." if len(resume_text) > 1000 else resume_text
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Analysis error: {e}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@app.get("/analysis-history/{user_id}")
async def get_analysis_history(user_id: str):
    """Get user's analysis history"""
    try:
        if not db_pool:
            raise HTTPException(status_code=500, detail="Database not available")
        
        async with db_pool.acquire() as conn:
            rows = await conn.fetch("""
                SELECT id, job_role, job_description, file_name, 
                       action_verb_score, star_methodology_score, ats_score, overall_score,
                       created_at
                FROM resume_analysis_history 
                WHERE user_id = $1 
                ORDER BY created_at DESC
            """, user_id)
            
            history = [dict(row) for row in rows]
            return {"status": "success", "history": history}
            
    except Exception as e:
        print(f"Error getting analysis history: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get history: {str(e)}")

@app.get("/analysis/{analysis_id}")
async def get_analysis_details(analysis_id: str):
    """Get detailed analysis by ID"""
    try:
        if not db_pool:
            raise HTTPException(status_code=500, detail="Database not available")
        
        async with db_pool.acquire() as conn:
            row = await conn.fetchrow("""
                SELECT * FROM resume_analysis_history WHERE id = $1
            """, analysis_id)
            
            if not row:
                raise HTTPException(status_code=404, detail="Analysis not found")
            
            analysis = dict(row)
            return {"status": "success", "analysis": analysis}
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting analysis details: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get analysis: {str(e)}")

@app.get("/profile-resumes/{user_id}")
async def get_profile_resumes(user_id: str):
    """Get user's existing resumes from profile builder"""
    try:
        if not db_pool:
            raise HTTPException(status_code=500, detail="Database not available")
        
        async with db_pool.acquire() as conn:
            rows = await conn.fetch("""
                SELECT id, filename, file_path, upload_date, processing_status
                FROM user_resumes 
                WHERE user_id = $1 
                ORDER BY upload_date DESC
            """, user_id)
            
            resumes = [dict(row) for row in rows]
            return {"status": "success", "resumes": resumes}
            
    except Exception as e:
        print(f"Error getting profile resumes: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get resumes: {str(e)}")

@app.get("/health")
async def health_check():
    """Enhanced health check"""
    health_status = {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "services": {
            "groq": groq_client is not None,
            "gemini": gemini_client is not None,
            "database": db_pool is not None,
            "supabase": supabase is not None
        },
        "features": {
            "enhanced_analysis": True,
            "action_verb_scoring": True,
            "star_methodology": True,
            "history_tracking": True
        }
    }
    
    return health_status

@app.get("/")
async def root():
    """Service information"""
    return {
        "service": "StudyMate Resume Analyzer",
        "version": "2.0.0",
        "description": "Enhanced AI-powered resume analysis with action words and STAR methodology scoring",
        "features": [
            "Comprehensive resume analysis",
            "Action verbs scoring and recommendations",
            "STAR methodology compliance analysis",
            "Analysis history tracking",
            "Profile integration",
            "ATS optimization recommendations"
        ],
        "endpoints": {
            "analyze": "/analyze-resume",
            "history": "/analysis-history/{user_id}",
            "details": "/analysis/{analysis_id}",
            "profile_resumes": "/profile-resumes/{user_id}",
            "health": "/health"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8003)