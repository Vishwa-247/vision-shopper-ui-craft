import os
import uuid
import httpx
from typing import Optional


async def transcribe_audio_deepgram(audio_blob: bytes, content_type: str = "audio/webm") -> str:
    """Transcribe audio using Deepgram API (primary)."""
    api_key = os.getenv("DEEPGRAM_API_KEY")
    if not api_key:
        raise ValueError("DEEPGRAM_API_KEY not configured")

    headers = {
        "Authorization": f"Token {api_key}",
        "Content-Type": content_type,
    }
    params = {
        "model": "nova-2",
        "smart_format": "true",
        "punctuate": "true",
    }

    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.post("https://api.deepgram.com/v1/listen", headers=headers, params=params, content=audio_blob)
        resp.raise_for_status()
        data = resp.json()
        return data["results"]["channels"][0]["alternatives"][0]["transcript"]


async def transcribe_audio_groq(audio_blob: bytes, content_type: str = "audio/webm") -> str:
    """Transcribe audio using Groq Whisper (fallback)."""
    from groq import Groq  # lazy import

    api_key = os.getenv("GROQ_WHISPER_KEY")
    if not api_key:
        raise ValueError("GROQ_WHISPER_KEY not configured")

    client = Groq(api_key=api_key)
    tmp_path = f"/tmp/{uuid.uuid4()}.webm"
    with open(tmp_path, "wb") as f:
        f.write(audio_blob)

    with open(tmp_path, "rb") as fh:
        transcription = client.audio.transcriptions.create(file=fh, model="whisper-large-v3", response_format="text")

    try:
        os.remove(tmp_path)
    except Exception:
        pass
    return transcription


async def transcribe_audio(audio_blob: bytes, content_type: Optional[str] = None) -> str:
    """Try Deepgram, then fallback to Groq Whisper."""
    try:
        return await transcribe_audio_deepgram(audio_blob, content_type or "audio/webm")
    except Exception:
        return await transcribe_audio_groq(audio_blob, content_type or "audio/webm")
