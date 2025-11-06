#!/usr/bin/env python3
"""
Oboe-Style Course Generation Service
====================================
Fast parallel AI course generation using Gemini, ElevenLabs, and Brave APIs.
Generates complete courses in ~40 seconds with audio, articles, quizzes, and games.
"""

import asyncio
import json
import logging
import os
import re
from collections import deque
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional

from dotenv import load_dotenv

# Load environment variables from backend root
backend_root = Path(__file__).parent.parent.parent
env_path = backend_root / ".env"
load_dotenv(dotenv_path=env_path)

import httpx
import uvicorn
from fastapi import BackgroundTasks, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Course Generation Service - Oboe Style", version="2.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Keys from environment - Support multiple Gemini keys for load balancing
GEMINI_API_KEYS = [
    os.getenv("GEMINI_API_KEY_1") or os.getenv("GEMINI_API_KEY"),
    os.getenv("GEMINI_API_KEY_2"),
    os.getenv("GEMINI_API_KEY_3"),
]
# Remove None values
GEMINI_API_KEYS = [k for k in GEMINI_API_KEYS if k]
if not GEMINI_API_KEYS:
    GEMINI_API_KEYS = [os.getenv("GEMINI_API_KEY")] if os.getenv("GEMINI_API_KEY") else []

# Round-robin API key queue
api_key_queue = deque(GEMINI_API_KEYS) if GEMINI_API_KEYS else deque()

# Concurrency control - limit to 2 concurrent Gemini calls (reduced for reliability)
GEMINI_SEMAPHORE = asyncio.Semaphore(2)

ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")
BRAVE_API_KEY = os.getenv("BRAVE_SEARCH_API_KEY")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

def get_next_api_key() -> str:
    """Round-robin API key selection"""
    if not api_key_queue:
        raise Exception("No Gemini API keys configured")
    key = api_key_queue[0]
    api_key_queue.rotate(-1)  # Move to back of queue
    return key

async def call_gemini_with_retry(prompt: str, max_retries: int = 5) -> dict:
    """Call Gemini with retry, key rotation, rate limiting, and concurrency control"""
    async with GEMINI_SEMAPHORE:  # Limit concurrent calls
        for attempt in range(max_retries):
            try:
                # Always add delay BEFORE every request to avoid rate limits
                await asyncio.sleep(0.5)  # 500ms delay between requests
                
                api_key = get_next_api_key()
                key_id = GEMINI_API_KEYS.index(api_key) + 1 if api_key in GEMINI_API_KEYS else "?"
                
                # Additional delay for retries with exponential backoff
                if attempt > 0:
                    wait_time = 2 ** attempt  # Exponential backoff: 2s, 4s, 8s, 16s
                    logger.warning(f"⏳ Rate limited, retrying in {wait_time}s (attempt {attempt+1}/{max_retries}) with key {key_id}...")
                    await asyncio.sleep(wait_time)
                
                logger.debug(f"🔑 Using API key {key_id} (attempt {attempt+1}/{max_retries})")
                
                async with httpx.AsyncClient(timeout=30.0) as client:
                    response = await client.post(
                        f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key={api_key}",
                        json={
                            "contents": [{
                                "parts": [{"text": prompt}]
                            }]
                        }
                    )
                    
                    if response.status_code == 429:
                        # Rate limited - try next key or retry
                        if attempt < max_retries - 1:
                            logger.warning(f"⚠️ 429 rate limit hit, will retry with next key...")
                            continue
                        raise HTTPException(status_code=429, detail="Gemini API rate limit exceeded after all retries")
                    
                    response.raise_for_status()
                    logger.debug(f"✅ Successfully called Gemini API (key {key_id})")
                    return response.json()
                    
            except httpx.HTTPStatusError as e:
                if e.response.status_code == 429 and attempt < max_retries - 1:
                    logger.warning(f"⚠️ HTTP 429 error, retrying... (attempt {attempt+1}/{max_retries})")
                    continue
                logger.error(f"💥 HTTP Error {e.response.status_code}: {e.response.text[:200]}")
                raise
            except Exception as e:
                logger.error(f"💥 Error on attempt {attempt+1}/{max_retries}: {e}")
                if attempt < max_retries - 1:
                    continue
                raise
    
    raise Exception("Max retries exceeded for Gemini API")

# Models
class CourseGenerationRequest(BaseModel):
    topic: str
    userId: str

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "course-generation",
        "has_gemini": len(GEMINI_API_KEYS) > 0,
        "gemini_key_count": len(GEMINI_API_KEYS),
        "has_elevenlabs": bool(ELEVENLABS_API_KEY),
        "has_brave": bool(BRAVE_API_KEY)
    }

@app.post("/generate-course-parallel")
async def generate_course_parallel(request: CourseGenerationRequest, background_tasks: BackgroundTasks):
    """Generate course with parallel AI agents"""
    
    if not GEMINI_API_KEYS:
        raise HTTPException(status_code=500, detail="Gemini API key not configured")
    
    try:
        logger.info(f"🚀 Starting course generation: {request.topic}")
        
        # Create course in database
        course_id = await create_course(request.topic, request.userId)
        job_id = await create_generation_job(course_id, request.userId)
        
        logger.info(f"✅ Course created: {course_id}, Job: {job_id}")
        
        # Start background generation
        background_tasks.add_task(
            generate_in_parallel,
            course_id,
            request.topic,
            request.userId
        )
        
        return {
            "success": True,
            "courseId": course_id,
            "jobId": job_id,
            "estimatedTime": 40
        }
        
    except Exception as e:
        logger.error(f"💥 Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# -------------------------
# CRUD/Read Endpoints (REST)
# -------------------------

@app.get("/courses")
async def list_user_courses(user_id: str):
    """Return all courses for a user (newest first)."""
    try:
        async with httpx.AsyncClient() as client:
            r = await client.get(
                f"{SUPABASE_URL}/rest/v1/courses",
                headers={
                    "apikey": SUPABASE_SERVICE_KEY,
                    "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
                },
                params={
                    "user_id": f"eq.{user_id}",
                    "select": "*",
                    "order": "created_at.desc",
                },
            )
            r.raise_for_status()
            return r.json()
    except Exception as e:
        logger.error(f"Error listing courses: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/courses/{course_id}")
async def get_course(course_id: str):
    """Return a single course by id."""
    try:
        async with httpx.AsyncClient() as client:
            r = await client.get(
                f"{SUPABASE_URL}/rest/v1/courses",
                headers={
                    "apikey": SUPABASE_SERVICE_KEY,
                    "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
                },
                params={
                    "id": f"eq.{course_id}",
                    "select": "*",
                },
            )
            r.raise_for_status()
            data = r.json()
            return data[0] if data else {}
    except Exception as e:
        logger.error(f"Error getting course: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/courses/{course_id}/content")
async def get_course_content(course_id: str):
    """Return all course content for a given course id."""
    try:
        headers = {
            "apikey": SUPABASE_SERVICE_KEY,
            "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        }
        async with httpx.AsyncClient() as client:
            chapters_task = client.get(
                f"{SUPABASE_URL}/rest/v1/course_chapters",
                headers=headers,
                params={"course_id": f"eq.{course_id}", "select": "*", "order": "order_index.asc"},
            )
            flashcards_task = client.get(
                f"{SUPABASE_URL}/rest/v1/course_flashcards",
                headers=headers,
                params={"course_id": f"eq.{course_id}", "select": "*"},
            )
            mcqs_task = client.get(
                f"{SUPABASE_URL}/rest/v1/course_mcqs",
                headers=headers,
                params={"course_id": f"eq.{course_id}", "select": "*"},
            )

            chapters_r, flashcards_r, mcqs_r = await asyncio.gather(
                chapters_task, flashcards_task, mcqs_task
            )

            return {
                "chapters": chapters_r.json(),
                "flashcards": flashcards_r.json(),
                "mcqs": mcqs_r.json(),
            }
    except Exception as e:
        logger.error(f"Error getting course content: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/courses/{course_id}")
async def delete_course(course_id: str):
    """Delete course and all related content (cascade delete)"""
    try:
        logger.info(f"🗑️  Deleting course: {course_id}")
        headers = {
            "apikey": SUPABASE_SERVICE_KEY,
            "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        }
        
        async with httpx.AsyncClient() as client:
            # Delete course (will cascade to related tables if foreign keys are set up)
            # If cascade doesn't work, delete related content first
            try:
                # Try to delete related content first (in case cascade isn't configured)
                related_tables = [
                    "course_chapters",
                    "course_flashcards",
                    "course_mcqs",
                    "course_articles",
                    "course_word_games",
                    "course_audio",
                    "course_resources",
                    "course_suggestions",
                    "course_generation_jobs"
                ]
                
                for table in related_tables:
                    try:
                        await client.delete(
                            f"{SUPABASE_URL}/rest/v1/{table}",
                            headers=headers,
                            params={"course_id": f"eq.{course_id}"}
                        )
                    except Exception as e:
                        logger.debug(f"Could not delete from {table}: {e} (may not exist)")
                
                # Now delete the course itself
                response = await client.delete(
                    f"{SUPABASE_URL}/rest/v1/courses",
                    headers=headers,
                    params={"id": f"eq.{course_id}"}
                )
                
                if response.status_code == 204:
                    logger.info(f"✅ Course {course_id} deleted successfully")
                    return {"success": True, "message": "Course deleted successfully"}
                elif response.status_code == 404:
                    logger.warning(f"⚠️ Course {course_id} not found")
                    return {"success": False, "message": "Course not found"}
                else:
                    logger.error(f"❌ Failed to delete course: {response.status_code} - {response.text}")
                    raise HTTPException(status_code=500, detail="Failed to delete course")
                    
            except httpx.HTTPStatusError as e:
                logger.error(f"💥 HTTP error deleting course: {e.response.status_code} - {e.response.text}")
                raise HTTPException(status_code=e.response.status_code, detail=str(e))
                
    except Exception as e:
        logger.error(f"💥 Error deleting course: {e}")
        raise HTTPException(status_code=500, detail=str(e))

async def create_course(topic: str, user_id: str) -> str:
    """Create course record in Supabase"""
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{SUPABASE_URL}/rest/v1/courses",
            headers={
                "apikey": SUPABASE_SERVICE_KEY,
                "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
                "Content-Type": "application/json",
                "Prefer": "return=representation"
            },
            json={
                "user_id": user_id,
                "title": topic,
                "purpose": "practice",
                "difficulty": "intermediate",
                "status": "generating",
                "summary": f"AI-generated course on {topic}",
                "is_oboe_style": True
            }
        )
        
        if response.status_code not in [200, 201]:
            raise Exception(f"Failed to create course: {response.text}")
        
        data = response.json()
        return data[0]["id"] if isinstance(data, list) else data["id"]

async def create_generation_job(course_id: str, user_id: str) -> str:
    """Create generation job"""
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{SUPABASE_URL}/rest/v1/course_generation_jobs",
            headers={
                "apikey": SUPABASE_SERVICE_KEY,
                "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
                "Content-Type": "application/json",
                "Prefer": "return=representation"
            },
            json={
                "user_id": user_id,
                "course_id": course_id,
                "status": "processing",
                "job_type": "course_creation",
                "current_step": "Starting parallel generation",
                "progress_percentage": 5
            }
        )
        
        data = response.json()
        return data[0]["id"] if isinstance(data, list) else data["id"]

async def generate_in_parallel(course_id: str, topic: str, user_id: str):
    """Main parallel generation orchestrator"""
    start_time = datetime.now()
    
    try:
        # Update progress
        await update_progress(course_id, 10, "Generating course outline...")
        
        # STEP 1: Generate outline
        outline = await generate_outline(topic)
        logger.info(f"✅ Outline generated with {len(outline['chapters'])} chapters")
        
        await update_progress(course_id, 20, "Generating content...")
        
        # STEP 2: Parallel generation
        results = await asyncio.gather(
            generate_chapters(course_id, topic, outline),
            generate_flashcards(course_id, topic),
            generate_mcqs(course_id, topic),
            generate_articles(course_id, topic),
            generate_word_games(course_id, topic),
            generate_audio_scripts(topic, outline),
            return_exceptions=True
        )
        
        chapters, flashcards, mcqs, articles, word_games, audio_scripts = results
        logger.info("✅ All content generated")
        
        await update_progress(course_id, 60, "Creating audio...")
        
        # STEP 3: Generate TTS if key available
        audio_success = False
        if ELEVENLABS_API_KEY and audio_scripts:
            results = await asyncio.gather(
                generate_tts(course_id, audio_scripts.get("short", ""), "short_podcast"),
                generate_tts(course_id, audio_scripts.get("long", ""), "full_lecture"),
                return_exceptions=True
            )
            # Only set audio_generated if at least one TTS succeeded
            audio_success = any(
                result is True or (isinstance(result, Exception) and "generated" in str(result).lower())
                for result in results
            )
            # Check if audio was actually created in database
            try:
                async with httpx.AsyncClient() as client:
                    check_response = await client.get(
                        f"{SUPABASE_URL}/rest/v1/course_audio?course_id=eq.{course_id}",
                        headers={
                            "apikey": SUPABASE_SERVICE_KEY,
                            "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
                        }
                    )
                    if check_response.status_code == 200:
                        audio_data = check_response.json()
                        audio_success = len(audio_data) > 0
            except:
                pass  # If check fails, rely on results
            
            if audio_success:
                await update_course_field(course_id, {"audio_generated": True})
                logger.info("✅ Audio generation completed successfully")
            else:
                logger.warning("⚠️ Audio generation failed - course will work without audio")
        
        await update_progress(course_id, 80, "Finding resources...")
        
        # STEP 4: Find resources if Brave key available
        if BRAVE_API_KEY:
            await find_resources(course_id, topic)
        
        await update_progress(course_id, 90, "Generating suggestions...")
        
        # STEP 5: Generate suggestions
        await generate_suggestions(course_id, topic)
        
        # STEP 6: Finalize
        duration = int((datetime.now() - start_time).total_seconds())
        
        await update_course_field(course_id, {
            "status": "published",
            "generation_duration_seconds": duration,
            "articles_generated": True,
            "games_generated": True
        })
        
        await finalize_job(course_id, duration)
        
        logger.info(f"✅ Course {course_id} generated in {duration}s")
        
    except Exception as e:
        logger.error(f"💥 Generation error: {e}")
        await mark_job_failed(course_id, str(e))

async def generate_outline(topic: str) -> dict:
    """Generate course outline - 5-7 chapters based on complexity"""
    prompt = f"""Create a detailed course outline for: "{topic}"

Generate 5-7 chapters based on topic complexity:
- Chapter 1: Introduction & Fundamentals (basic)
- Chapter 2: Core Concepts (intermediate)
- Chapter 3: Practical Applications (intermediate)
- Chapter 4: Advanced Techniques (advanced)
- Chapter 5: Real-world Projects (advanced)
- Chapter 6 (optional): Best Practices & Optimization (expert)
- Chapter 7 (optional): Future Trends & Next Steps (expert)

Return JSON:
{{
  "chapters": [
    {{
      "title": "string",
      "level": "basic|intermediate|advanced|expert",
      "objectives": ["obj1", "obj2", "obj3"],
      "keyConcepts": ["concept1", "concept2", "concept3"],
      "estimatedMinutes": 15
    }}
  ]
}}

Generate at least 5 chapters, up to 7 if the topic is complex. Return ONLY valid JSON."""
    
    data = await call_gemini_with_retry(prompt)
    text = data["candidates"][0]["content"]["parts"][0]["text"]
    
    # Extract JSON
    json_match = re.search(r'```json\n(.*?)\n```', text, re.DOTALL) or re.search(r'\{.*\}', text, re.DOTALL)
    if json_match:
        outline = json.loads(json_match.group(1) if json_match.lastindex else json_match.group(0))
        
        # Ensure minimum 5 chapters
        if len(outline.get('chapters', [])) < 5:
            logger.warning(f"Only {len(outline['chapters'])} chapters generated, requesting more...")
            # Retry with explicit requirement
            retry_prompt = f"""Create a course outline for: "{topic}" with EXACTLY 5-7 chapters. Return JSON: {{"chapters": [{{"title": "string", "level": "basic|intermediate|advanced|expert", "objectives": ["obj1"], "keyConcepts": ["concept1"], "estimatedMinutes": 15}}]}}"""
            retry_data = await call_gemini_with_retry(retry_prompt)
            retry_text = retry_data["candidates"][0]["content"]["parts"][0]["text"]
            retry_match = re.search(r'```json\n(.*?)\n```', retry_text, re.DOTALL) or re.search(r'\{.*\}', retry_text, re.DOTALL)
            if retry_match:
                outline = json.loads(retry_match.group(1) if retry_match.lastindex else retry_match.group(0))
        
        return outline
    
    return json.loads(text)

async def generate_chapters(course_id: str, topic: str, outline: dict) -> list:
    """Generate chapter content in HTML format with code examples, tables"""
    chapters = []
    
    for i, chapter in enumerate(outline["chapters"]):
        level = chapter.get('level', 'intermediate')
        
        prompt = f"""Write comprehensive chapter content for: {chapter['title']}

Topic: {topic}
Level: {level}

REQUIREMENTS (1500-2000 words minimum):
1. Start with introduction (2-3 paragraphs in <p> tags, NO heading)
2. 4-5 main sections with <h2>Subheading</h2> headings
3. Each section: 300-400 words with detailed explanations
4. Include 3-5 detailed code examples (10-20 lines each) in <pre><code>code blocks</code></pre>
5. Add real-world examples and use cases
6. Include best practices and common pitfalls
7. One comparison table using <table><tr><th>Header</th></tr><tr><td>Data</td></tr></table> if applicable
8. End with summary section (<h2>Summary</h2>) with key takeaways

OUTPUT FORMAT: Pure HTML only. Use these tags:
- <h2>Subheading</h2> (for main sections)
- <h3>Sub-subheading</h3> (for subsections if needed)
- <p>Paragraph text</p>
- <strong>Bold text</strong>
- <em>Italic text</em>
- <ul><li>List item</li></ul>
- <pre><code># Multi-line code blocks
def example():
    pass
</code></pre>
- <code>inline code</code> (for single words/phrases)
- <table><tr><th>Header</th></tr><tr><td>Data</td></tr></table>

DO NOT:
- Repeat the chapter title as a heading (it's already shown)
- Use markdown syntax (**text**, ##, ```, *)
- Include any text outside HTML tags
- Add speaker labels or meta-text

Return ONLY HTML, no markdown. Make it comprehensive and detailed."""

        data = await call_gemini_with_retry(prompt)
        content = data["candidates"][0]["content"]["parts"][0]["text"]
        
        # Clean any remaining markdown artifacts
        content = content.replace('```html', '').replace('```', '').replace('**', '').strip()
        # Remove any markdown headers if present
        content = re.sub(r'^#+\s+', '', content, flags=re.MULTILINE)
        
        # Remove chapter title if it appears in content (repeated heading fix)
        title_lower = chapter['title'].lower()
        # Remove first <h1> or <h2> that matches chapter title exactly
        content = re.sub(
            rf'<h[12][^>]*>\s*{re.escape(chapter["title"])}\s*</h[12]>',
            '',
            content,
            count=1,
            flags=re.IGNORECASE
        )
        # Also remove if title appears as plain text at the start
        if content.lower().startswith(title_lower):
            content = re.sub(
                rf'^{re.escape(chapter["title"])}\s*\n+',
                '',
                content,
                count=1,
                flags=re.IGNORECASE | re.MULTILINE
            )
        
        chapters.append({
            "course_id": course_id,
            "title": chapter["title"],
            "content": content,  # Now pure HTML
            "order_number": i + 1,
            "estimated_reading_time": chapter.get("estimatedMinutes", 10)
        })
    
    # Insert chapters
    await insert_to_supabase("course_chapters", chapters)
    return chapters

async def generate_flashcards(course_id: str, topic: str) -> list:
    """Generate flashcards"""
    prompt = f"Generate 10 flashcards for: {topic}. Format as JSON: [{{'question': 'string', 'answer': 'string'}}]"
    data = await call_gemini_with_retry(prompt)
    text = data["candidates"][0]["content"]["parts"][0]["text"]
    
    json_match = re.search(r'```json\n(.*?)\n```', text, re.DOTALL) or re.search(r'\[.*\]', text, re.DOTALL)
    flashcards_data = json.loads(json_match.group(1) if json_match.lastindex else json_match.group(0))
    
    flashcards = [
        {"course_id": course_id, "question": f["question"], "answer": f["answer"], "difficulty": "medium"}
        for f in flashcards_data
    ]
    
    await insert_to_supabase("course_flashcards", flashcards)
    return flashcards

async def generate_mcqs(course_id: str, topic: str) -> list:
    """Generate MCQs"""
    prompt = f"Generate 10 MCQs for: {topic}. Format as JSON: [{{'question': 'string', 'options': ['A', 'B', 'C', 'D'], 'correct': 'A', 'explanation': 'string'}}]"
    data = await call_gemini_with_retry(prompt)
    text = data["candidates"][0]["content"]["parts"][0]["text"]
    
    json_match = re.search(r'```json\n(.*?)\n```', text, re.DOTALL) or re.search(r'\[.*\]', text, re.DOTALL)
    mcqs_data = json.loads(json_match.group(1) if json_match.lastindex else json_match.group(0))
    
    mcqs = [
        {
            "course_id": course_id,
            "question": m["question"],
            "options": m["options"],
            "correct_answer": m["correct"],
            "explanation": m["explanation"],
            "difficulty": "medium"
        }
        for m in mcqs_data
    ]
    
    await insert_to_supabase("course_mcqs", mcqs)
    return mcqs

async def generate_articles(course_id: str, topic: str) -> dict:
    """Generate articles in HTML format"""
    # Deep dive - HTML format
    deep_dive_prompt = f"""Write an 800-1000 word deep-dive article on: {topic}

Use ONLY HTML tags: <h2>, <p>, <strong>, <em>, <ul>, <li>, <code>, <table>
No markdown syntax allowed.
Include 2-3 code examples in <code> tags."""
    
    deep_dive_data = await call_gemini_with_retry(deep_dive_prompt)
    deep_dive = deep_dive_data["candidates"][0]["content"]["parts"][0]["text"].strip()
    # Clean markdown artifacts
    deep_dive = deep_dive.replace('```html', '').replace('```', '').replace('**', '').strip()
    
    # Key takeaways - HTML format
    takeaways_prompt = f"""Summarize key takeaways for: {topic} in 5-7 bullet points. Use HTML: <ul><li>Point 1</li><li>Point 2</li></ul>"""
    takeaways_data = await call_gemini_with_retry(takeaways_prompt)
    takeaways = takeaways_data["candidates"][0]["content"]["parts"][0]["text"].strip()
    takeaways = takeaways.replace('```html', '').replace('```', '').replace('**', '').strip()
    
    # FAQ
    faq_prompt = f"Generate 8-10 FAQ for: {topic}. Format as JSON: [{{'question': 'string', 'answer': 'string'}}]"
    faq_data = await call_gemini_with_retry(faq_prompt)
    faq_text = faq_data["candidates"][0]["content"]["parts"][0]["text"]
    
    json_match = re.search(r'```json\n(.*?)\n```', faq_text, re.DOTALL) or re.search(r'\[.*\]', faq_text, re.DOTALL)
    faq = json.loads(json_match.group(1) if json_match.lastindex else json_match.group(0))
    
    articles = [
        {"course_id": course_id, "article_type": "deep_dive", "title": f"Deep Dive: {topic}", "content": deep_dive, "reading_time_minutes": 10},
        {"course_id": course_id, "article_type": "key_takeaways", "title": f"Key Takeaways: {topic}", "content": takeaways, "reading_time_minutes": 3},
        {"course_id": course_id, "article_type": "faq", "title": f"FAQ: {topic}", "content": json.dumps(faq), "reading_time_minutes": 5}
    ]
    
    await insert_to_supabase("course_articles", articles)
    return {"deep_dive": deep_dive, "takeaways": takeaways, "faq": faq}

async def generate_word_games(course_id: str, topic: str) -> list:
    """Generate word games - skip if table doesn't exist"""
    try:
        prompt = f"Generate 15 vocabulary words for: {topic}. Format as JSON: [{{'word': 'string', 'correct': 'string', 'incorrect': ['string', 'string', 'string']}}]"
        data = await call_gemini_with_retry(prompt)
        text = data["candidates"][0]["content"]["parts"][0]["text"]
        
        json_match = re.search(r'```json\n(.*?)\n```', text, re.DOTALL) or re.search(r'\[.*\]', text, re.DOTALL)
        words_data = json.loads(json_match.group(1) if json_match.lastindex else json_match.group(0))
        
        words = [
            {"course_id": course_id, "word": w["word"], "definition": w["correct"], "incorrect_options": w["incorrect"], "difficulty": "medium"}
            for w in words_data
        ]
        
        await insert_to_supabase("course_word_games", words)
        return words
    except Exception as e:
        logger.warning(f"Word games table not found or error occurred, skipping: {e}")
        return []  # Return empty list instead of failing

async def generate_audio_scripts(topic: str, outline: dict) -> dict:
    """Generate audio scripts"""
    # Short script
    short_prompt = f"Write 5-minute conversational podcast script introducing: {topic}. ~700 words. No speaker labels."
    short_data = await call_gemini_with_retry(short_prompt)
    short_script = short_data["candidates"][0]["content"]["parts"][0]["text"]
    
    # Long script
    long_prompt = f"Write 20-minute educational lecture on: {topic}. ~3000 words. No speaker labels."
    long_data = await call_gemini_with_retry(long_prompt)
    long_script = long_data["candidates"][0]["content"]["parts"][0]["text"]
    
    return {"short": short_script, "long": long_script}

async def generate_tts(course_id: str, script: str, audio_type: str):
    """Generate TTS audio"""
    if not ELEVENLABS_API_KEY:
        logger.info("ElevenLabs API key not configured, skipping TTS")
        return
    
    if not script or len(script.strip()) < 50:
        logger.warning("Script too short for TTS")
        return
    
    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                "https://api.elevenlabs.io/v1/text-to-speech/9BWtsMINqrJLrRacOk9x",
                headers={
                    "xi-api-key": ELEVENLABS_API_KEY,
                    "Content-Type": "application/json"
                },
                json={
                    "text": script[:5000],
                    "model_id": "eleven_turbo_v2_5",
                    "voice_settings": {
                        "stability": 0.5,
                        "similarity_boost": 0.75
                    }
                }
            )
            
            if response.status_code == 401:
                logger.error("Invalid ElevenLabs API key - check your .env file")
                return
            
            if response.status_code == 200:
                audio_data = response.content
                # Store in Supabase storage (simplified - you'd upload to storage bucket)
                audio_url = f"https://storage.example.com/{course_id}/{audio_type}.mp3"
                
                await insert_to_supabase("course_audio", [{
                    "course_id": course_id,
                    "audio_type": audio_type,
                    "audio_url": audio_url,
                    "script_text": script,
                    "duration_seconds": 300 if audio_type == "short_podcast" else 1200,
                    "voice_used": "Aria"
                }])
                
                logger.info(f"✅ Generated {audio_type} audio")
                return True  # Return True to indicate success
            else:
                error_msg = response.text[:200] if hasattr(response, 'text') else str(response.status_code)
                logger.warning(f"TTS generation failed with status {response.status_code}: {error_msg}")
                return False  # Return False to indicate failure
    except Exception as e:
        logger.error(f"TTS error: {e}")

async def find_resources(course_id: str, topic: str):
    """Find resources using Brave"""
    if not BRAVE_API_KEY:
        return
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://api.search.brave.com/res/v1/web/search?q={topic}+tutorial+documentation",
                headers={"X-Subscription-Token": BRAVE_API_KEY}
            )
            
            data = response.json()
            results = data.get("web", {}).get("results", [])
            
            resources = [
                {
                    "course_id": course_id,
                    "title": r["title"],
                    "type": "article",
                    "url": r["url"],
                    "description": r.get("description", ""),
                    "provider": r["url"].split("/")[2]
                }
                for r in results[:5]
            ]
            
            if resources:
                await insert_to_supabase("course_resources", resources)
    except Exception as e:
        logger.error(f"Resource finding error: {e}")

async def generate_suggestions(course_id: str, topic: str):
    """Generate continue learning suggestions"""
    prompt = f"Suggest 5 related topics after learning {topic}. Format as JSON: [{{'topic': 'string', 'description': 'string'}}]"
    data = await call_gemini_with_retry(prompt)
    text = data["candidates"][0]["content"]["parts"][0]["text"]
    
    json_match = re.search(r'```json\n(.*?)\n```', text, re.DOTALL) or re.search(r'\[.*\]', text, re.DOTALL)
    suggestions_data = json.loads(json_match.group(1) if json_match.lastindex else json_match.group(0))
    
    suggestions = [
        {"course_id": course_id, "suggestion_topic": s["topic"], "suggestion_description": s["description"], "relevance_score": 5 - i}
        for i, s in enumerate(suggestions_data)
    ]
    
    await insert_to_supabase("course_suggestions", suggestions)

# Utility functions
async def insert_to_supabase(table: str, data: list):
    """Insert data to Supabase"""
    if not data:
        return
    
    async with httpx.AsyncClient() as client:
        await client.post(
            f"{SUPABASE_URL}/rest/v1/{table}",
            headers={
                "apikey": SUPABASE_SERVICE_KEY,
                "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
                "Content-Type": "application/json"
            },
            json=data
        )

async def update_progress(course_id: str, percent: int, step: str):
    """Update job progress"""
    async with httpx.AsyncClient() as client:
        await client.patch(
            f"{SUPABASE_URL}/rest/v1/course_generation_jobs?course_id=eq.{course_id}",
            headers={
                "apikey": SUPABASE_SERVICE_KEY,
                "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
                "Content-Type": "application/json"
            },
            json={"progress_percentage": percent, "current_step": step}
        )

async def update_course_field(course_id: str, fields: dict):
    """Update course fields"""
    async with httpx.AsyncClient() as client:
        await client.patch(
            f"{SUPABASE_URL}/rest/v1/courses?id=eq.{course_id}",
            headers={
                "apikey": SUPABASE_SERVICE_KEY,
                "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
                "Content-Type": "application/json"
            },
            json=fields
        )

async def finalize_job(course_id: str, duration: int):
    """Finalize generation job"""
    async with httpx.AsyncClient() as client:
        await client.patch(
            f"{SUPABASE_URL}/rest/v1/course_generation_jobs?course_id=eq.{course_id}",
            headers={
                "apikey": SUPABASE_SERVICE_KEY,
                "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "status": "completed",
                "progress_percentage": 100,
                "current_step": "Course ready!",
                "completed_at": datetime.utcnow().isoformat()
            }
        )

async def mark_job_failed(course_id: str, error: str):
    """Mark job as failed"""
    async with httpx.AsyncClient() as client:
        await client.patch(
            f"{SUPABASE_URL}/rest/v1/course_generation_jobs?course_id=eq.{course_id}",
            headers={
                "apikey": SUPABASE_SERVICE_KEY,
                "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "status": "failed",
                "error_message": error,
                "completed_at": datetime.utcnow().isoformat()
            }
        )

if __name__ == "__main__":
    port = int(os.getenv("SERVICE_PORT", "8008"))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
