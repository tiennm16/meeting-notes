from ..config import get_settings
from openai import OpenAI 

async def transcribe(audio_path: str) -> str:
    settings = get_settings()
    client = OpenAI(api_key=settings.openai_api_key)
    with open(audio_path, "rb") as audio_file: 
        transcript = client.audio.transcriptions.create(
            model=settings.openai_transcription_model,
            file=audio_file
    )
    return transcript.text or ""
