import logging

from youtube_transcript_api import YouTubeTranscriptApi

logger = logging.getLogger(__name__)


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
        error_name = type(error).__name__
        logger.warning("YouTube transcript retrieval failed (%s): %s", error_name, str(error)[:400])

        if error_name in {"RequestBlocked", "IpBlocked"}:
            message = (
                "YouTube blocked caption requests from the backend’s network. "
                "If the API is hosted on Vercel, try running the backend locally; "
                "YouTube often blocks cloud-server IP addresses."
            )
        elif error_name in {"TranscriptsDisabled", "NoTranscriptFound"}:
            message = "No captions are available for this video in a language the app can retrieve."
        elif error_name in {"VideoUnavailable", "VideoUnplayable", "AgeRestricted"}:
            message = "This video is unavailable or restricted, so its captions could not be retrieved."
        else:
            message = f"Caption retrieval failed ({error_name}). Check the backend terminal for details."

        raise TranscriptError(message) from error
