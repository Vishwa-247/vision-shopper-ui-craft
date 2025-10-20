#!/usr/bin/env python3
"""
DSA Feedback Service - Enhanced AI suggestions and chatbot integration
"""

import os
import json
import asyncio
import logging
from datetime import datetime
from typing import Dict, List, Optional, Any
from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel
import httpx
from groq import Groq

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(title="DSA Feedback Service", version="1.0.0")

# Environment variables
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

# Initialize Groq client
groq_client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None

# Pydantic models
class FeedbackRequest(BaseModel):
    feedback_id: str
    user_id: str
    problem_name: str
    difficulty: str
    category: str
    rating: int
    time_spent: Optional[int] = None
    struggled_areas: List[str] = []
    detailed_feedback: Optional[str] = ""

class ChatbotRequest(BaseModel):
    query: str
    user_id: str
    context: str = "dsa_practice"
    user_level: str = "intermediate"

class ChatbotResponse(BaseModel):
    response: str
    source: str
    suggestions: Optional[List[Dict]] = None

class AISuggestions(BaseModel):
    approach_suggestions: List[str]
    key_concepts: List[str]
    similar_problems: List[str]
    learning_resources: List[Dict[str, str]]
    overall_advice: str

# Utility functions
async def get_user_feedback_history(user_id: str, limit: int = 5) -> List[Dict]:
    """Get user's recent feedback history for context"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{SUPABASE_URL}/rest/v1/dsa_feedbacks",
                headers={
                    "apikey": SUPABASE_SERVICE_KEY,
                    "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
                    "Content-Type": "application/json"
                },
                params={
                    "user_id": f"eq.{user_id}",
                    "order": "created_at.desc",
                    "limit": str(limit),
                    "select": "problem_name,difficulty,rating,struggled_areas,ai_suggestions"
                }
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                logger.warning(f"Failed to fetch feedback history: {response.status_code}")
                return []
    except Exception as e:
        logger.error(f"Error fetching feedback history: {e}")
        return []

async def update_feedback_suggestions(feedback_id: str, suggestions: AISuggestions):
    """Update feedback with AI suggestions"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.patch(
                f"{SUPABASE_URL}/rest/v1/dsa_feedbacks",
                headers={
                    "apikey": SUPABASE_SERVICE_KEY,
                    "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
                    "Content-Type": "application/json"
                },
                params={"id": f"eq.{feedback_id}"},
                json={
                    "ai_suggestions": suggestions.dict(),
                    "updated_at": datetime.utcnow().isoformat()
                }
            )
            
            if response.status_code == 200:
                logger.info(f"✅ Updated feedback {feedback_id} with AI suggestions")
            else:
                logger.error(f"Failed to update feedback: {response.status_code}")
    except Exception as e:
        logger.error(f"Error updating feedback suggestions: {e}")

# AI Generation functions
async def generate_enhanced_ai_suggestions(feedback: FeedbackRequest) -> AISuggestions:
    """Generate enhanced AI suggestions based on specific feedback"""
    
    if not groq_client:
        raise HTTPException(status_code=500, detail="Groq API key not configured")
    
    # Build enhanced prompt
    struggled_areas_text = ", ".join(feedback.struggled_areas) if feedback.struggled_areas else "None specified"
    time_info = f" (spent {feedback.time_spent} minutes)" if feedback.time_spent else ""
    
    prompt = f"""You are an expert DSA mentor analyzing a student's feedback.

PROBLEM DETAILS:
- Problem: {feedback.problem_name}
- Difficulty: {feedback.difficulty}
- Category: {feedback.category}
- Rating: {feedback.rating}/5 stars{time_info}
- Struggled With: {struggled_areas_text}
- Additional Feedback: {feedback.detailed_feedback or "None"}

Based on this SPECIFIC feedback, provide PERSONALIZED suggestions:

1. **Approach Suggestions** (3-5 tactical strategies):
   - Address the EXACT areas they struggled with: {struggled_areas_text}
   - Be specific to {feedback.problem_name}
   - Include mental models or patterns
   - Consider their {feedback.difficulty} level

2. **Key Concepts** (3-4 fundamental concepts):
   - Focus on gaps revealed by their struggles
   - Link to theoretical foundations
   - Explain why these concepts matter for {feedback.category}

3. **Similar Problems** (3-4 practice recommendations):
   - Gradually increasing difficulty
   - Same concept, different context
   - Include problem names and brief descriptions

4. **Learning Resources** (3-4 specific resources):
   - Format: {{"type": "video/article/course", "title": "...", "description": "...", "url": "..."}}
   - Target their knowledge gaps
   - Include YouTube videos when relevant

5. **Overall Advice** (2-3 sentences of encouragement):
   - Acknowledge their specific struggles
   - Provide motivation and next steps

IMPORTANT: 
- Make suggestions UNIQUE to this feedback, not generic advice
- Be specific to {feedback.problem_name} and their struggles
- Consider their {feedback.rating}/5 rating and time spent
- Return valid JSON only

Return JSON in this exact format:
{{
  "approach_suggestions": ["strategy1", "strategy2", "strategy3"],
  "key_concepts": ["concept1", "concept2", "concept3"],
  "similar_problems": ["problem1", "problem2", "problem3"],
  "learning_resources": [
    {{"type": "video", "title": "Title", "description": "Description", "url": "https://..."}},
    {{"type": "article", "title": "Title", "description": "Description", "url": "https://..."}}
  ],
  "overall_advice": "Encouraging advice specific to their situation"
}}"""

    try:
        response = groq_client.chat.completions.create(
            messages=[
                {"role": "system", "content": "You are an expert DSA mentor. Always respond with valid JSON only."},
                {"role": "user", "content": prompt}
            ],
            model="llama-3.3-70b-versatile",
            temperature=0.7,
            max_tokens=2000
        )
        
        response_text = response.choices[0].message.content.strip()
        
        # Clean the response
        if response_text.startswith('```json'):
            response_text = response_text.replace('```json', '').replace('```', '')
        elif response_text.startswith('```'):
            response_text = response_text.replace('```', '')
        
        response_text = response_text.strip()
        
        if not response_text:
            raise Exception("Empty response from Groq")
        
        suggestions_data = json.loads(response_text)
        
        return AISuggestions(
            approach_suggestions=suggestions_data.get("approach_suggestions", []),
            key_concepts=suggestions_data.get("key_concepts", []),
            similar_problems=suggestions_data.get("similar_problems", []),
            learning_resources=suggestions_data.get("learning_resources", []),
            overall_advice=suggestions_data.get("overall_advice", "")
        )
        
    except Exception as e:
        logger.error(f"Enhanced AI suggestions generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"AI suggestions generation failed: {str(e)}")

async def generate_contextual_chatbot_response(query: str, user_id: str, feedback_history: List[Dict]) -> ChatbotResponse:
    """Generate contextual chatbot response using feedback history"""
    
    if not groq_client:
        raise HTTPException(status_code=500, detail="Groq API key not configured")
    
    # Analyze feedback history
    common_struggles = {}
    low_rated_problems = []
    recent_categories = []
    
    for feedback in feedback_history:
        # Count struggles
        for area in feedback.get("struggled_areas", []):
            common_struggles[area] = common_struggles.get(area, 0) + 1
        
        # Track low ratings
        if feedback.get("rating", 5) <= 2:
            low_rated_problems.append(feedback.get("problem_name", ""))
        
        # Track categories
        if feedback.get("category"):
            recent_categories.append(feedback.get("category"))
    
    # Build context
    context_parts = []
    if common_struggles:
        top_struggles = sorted(common_struggles.items(), key=lambda x: x[1], reverse=True)[:3]
        context_parts.append(f"Recent struggles: {', '.join([s[0] for s in top_struggles])}")
    
    if low_rated_problems:
        context_parts.append(f"Challenging problems: {', '.join(low_rated_problems[:3])}")
    
    if recent_categories:
        unique_categories = list(set(recent_categories))
        context_parts.append(f"Recent focus areas: {', '.join(unique_categories[:3])}")
    
    context_text = ". ".join(context_parts) if context_parts else "No recent feedback history"
    
    # Build enhanced prompt
    system_prompt = f"""You are an expert DSA tutor and mentor. 

STUDENT CONTEXT:
{context_text}

INSTRUCTIONS:
- Provide personalized advice based on their learning history
- When suggesting resources, include YouTube video links in markdown format: [Video Title](https://youtube.com/watch?v=...)
- Be encouraging and specific to their struggles
- Include code examples when relevant
- Suggest practice problems that build on their recent work
- Keep responses concise but helpful (2-3 paragraphs max)

RESPONSE FORMAT:
- Start with acknowledging their specific situation if relevant
- Provide actionable advice
- Include relevant resources with clickable links
- End with encouragement and next steps"""

    try:
        response = groq_client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": query}
            ],
            model="llama-3.3-70b-versatile",
            temperature=0.7,
            max_tokens=1000
        )
        
        response_text = response.choices[0].message.content.strip()
        
        return ChatbotResponse(
            response=response_text,
            source="contextual_ai",
            suggestions=None
        )
        
    except Exception as e:
        logger.error(f"Contextual chatbot response generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Chatbot response generation failed: {str(e)}")

# API Endpoints
@app.post("/generate-suggestions")
async def generate_suggestions_endpoint(feedback: FeedbackRequest):
    """Generate enhanced AI suggestions for feedback"""
    try:
        logger.info(f"Generating AI suggestions for feedback: {feedback.feedback_id}")
        
        # Generate AI suggestions
        suggestions = await generate_enhanced_ai_suggestions(feedback)
        
        # Update feedback in database
        await update_feedback_suggestions(feedback.feedback_id, suggestions)
        
        return {
            "success": True,
            "message": "AI suggestions generated successfully",
            "suggestions": suggestions.dict()
        }
        
    except Exception as e:
        logger.error(f"Error generating suggestions: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chatbot-response")
async def chatbot_response_endpoint(request: ChatbotRequest):
    """Generate contextual chatbot response"""
    try:
        logger.info(f"Generating chatbot response for user: {request.user_id}")
        
        # Get user's feedback history
        feedback_history = await get_user_feedback_history(request.user_id)
        
        # Generate contextual response
        response = await generate_contextual_chatbot_response(
            request.query, 
            request.user_id, 
            feedback_history
        )
        
        return response
        
    except Exception as e:
        logger.error(f"Error generating chatbot response: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "dsa-feedback-service",
        "timestamp": datetime.utcnow().isoformat(),
        "groq_configured": groq_client is not None
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8007)
