from youtube_transcript_api import YouTubeTranscriptApi


class TranscriptError(Exception):
    pass


def fetch_transcript(video_id: str) -> tuple[str, str]:
    try:
        transcript = YouTubeTranscriptApi().fetch(video_id)
        snippets = transcript.to_raw_data()
        text = " ".join(item["text"].replace("\n", " ").strip() for item in snippets if item.get("text", "").strip())
        if not text:
            raise TranscriptError("No captions were found for this video.")
        return text, getattr(transcript, "language_code", "unknown")
    except TranscriptError:
        raise
    except Exception as error:
        raise TranscriptError("We couldn’t retrieve captions for this video. It may have captions disabled or be unavailable from this server.") from error
