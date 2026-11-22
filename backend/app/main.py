import os
import re
from typing import Any
from urllib.parse import parse_qs, urlparse

import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from .pipeline import analyze_transcript
from .transcripts import TranscriptError, fetch_transcript

app = FastAPI(title="VidBrief API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")],
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


class AnalyzeRequest(BaseModel):
    url: str = Field(min_length=8, max_length=500)


def parse_video_id(url: str) -> str:
    try:
        parsed = urlparse(url.strip())
        host = (parsed.hostname or "").lower()
        if host not in {"youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be", "www.youtube-nocookie.com"}:
            raise ValueError
        if host == "youtu.be":
            video_id = parsed.path.strip("/").split("/")[0]
        elif parsed.path == "/watch":
            video_id = parse_qs(parsed.query).get("v", [""])[0]
        else:
            match = re.match(r"/(?:embed|shorts)/([\w-]{11})(?:/|$)", parsed.path)
            video_id = match.group(1) if match else ""
        if re.fullmatch(r"[\w-]{11}", video_id):
            return video_id
    except ValueError:
        pass
    raise HTTPException(status_code=400, detail="Enter a valid YouTube video URL.")


async def get_video_title(video_id: str) -> str:
    try:
        async with httpx.AsyncClient(timeout=8) as client:
            response = await client.get("https://www.youtube.com/oembed", params={"url": f"https://www.youtube.com/watch?v={video_id}", "format": "json"})
            response.raise_for_status()
            return response.json().get("title", "YouTube video")
    except Exception:
        return "YouTube video"


@app.get("/api/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/analyze")
async def analyze(request: AnalyzeRequest) -> dict[str, Any]:
    video_id = parse_video_id(request.url)
    try:
        transcript, language = fetch_transcript(video_id)
    except TranscriptError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error

    title = await get_video_title(video_id)
    insights = await analyze_transcript(transcript)
    return {
        "video": {"id": video_id, "title": title, "url": f"https://www.youtube.com/watch?v={video_id}", "language": language},
        "transcript": transcript,
        **insights,
    }
