import os
import re
import logging
from typing import Any
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

SYSTEM = "You analyze YouTube transcripts. Use only information supported by the transcript. Be concise and clear. If something is uncertain, say so. Return valid JSON only."
logger = logging.getLogger(__name__)


def fallback(transcript: str, message: str = "No API key was found in backend/.env.") -> dict[str, Any]:
    sentences = [part.strip() for part in re.split(r"(?<=[.!?])\s+", transcript) if len(part.strip()) > 35]
    points = sentences[:6]
    return {
        "summary": f"The transcript was retrieved, but AI analysis is unavailable. {message}",
        "key_points": points or [transcript[:240]],
        "outline": [{"section": f"Part {i + 1}", "description": point} for i, point in enumerate(points[:5])],
        "script": "A script-style recap will appear here when AI analysis is available.",
        "agent_notes": ["Transcript retrieval complete", message],
        "used_ai": False,
    }


async def analyze_transcript(transcript: str) -> dict[str, Any]:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return fallback(transcript, "No GEMINI_API_KEY was found in backend/.env.")

    from google import genai
    from google.genai import types

    client = genai.Client(api_key=api_key)
    model = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")
    # Three focused agents run in parallel to keep the result quick while preserving specialist prompts.
    tasks = [
        ("summary", "Return JSON with one field summary: a useful 2-4 paragraph overview of what the video covers."),
        ("key_points", "Return JSON with one field key_points: an array of 5-10 specific, non-redundant main takeaways."),
        ("outline", "Return JSON with fields outline (array of section and description objects, in order) and script (a concise narration-style recap of the video)."),
    ]

    def run_agent(name: str, instruction: str) -> dict[str, Any]:
        response = client.models.generate_content(
            model=model,
            contents=f"Transcript:\n{transcript[:100000]}",
            config=types.GenerateContentConfig(
                system_instruction=f"{SYSTEM}\nSpecialist role: {name}. {instruction}",
                response_mime_type="application/json",
            ),
        )
        import json
        return json.loads(response.text)

    import asyncio
    try:
        summary, points, outline = await asyncio.gather(*(asyncio.to_thread(run_agent, name, prompt) for name, prompt in tasks))
        return {"summary": summary.get("summary", ""), "key_points": points.get("key_points", []), "outline": outline.get("outline", []), "script": outline.get("script", ""), "agent_notes": ["Summary agent complete", "Key-points agent complete", "Outline and script agent complete"], "used_ai": True}
    except Exception as error:
        # Avoid logging exception text because provider errors can include request details.
        error_type = type(error).__name__
        logger.error("Gemini analysis failed (%s). Check the API key, project access, billing, and model setting.", error_type)
        return fallback(transcript, f"The backend reported {error_type}; check its terminal for setup details.")
