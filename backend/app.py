import io
import os

import requests
from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

try:
    import geminiapi
except ModuleNotFoundError:
    geminiapi = None

load_dotenv()

ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")
ELEVENLABS_VOICE_ID = os.getenv("ELEVENLABS_VOICE_ID", "pNInz6obpgDQGcFmaJgB")
ELEVENLABS_MODEL_ID = os.getenv("ELEVENLABS_MODEL_ID", "eleven_flash_v2_5")
ELEVENLABS_OUTPUT_FORMAT = os.getenv("ELEVENLABS_OUTPUT_FORMAT", "mp3_44100_128")
ELEVENLABS_BASE_URL = os.getenv("ELEVENLABS_BASE_URL", "https://api.elevenlabs.io")

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten this in production
    allow_methods=["*"],
    allow_headers=["*"],
)


class UserProfile(BaseModel):
    gender: str
    major: str
    about: str


class TTSRequest(BaseModel):
    text: str = Field(min_length=1, max_length=500)


@app.get("/health")
def health():
    return {"ok": True}


@app.post("/recommend")
async def recommend(profile: UserProfile):
    print(profile.gender, profile.major, profile.about)

    if geminiapi is None:
        return {
            "clubs": [
                "Backend is running, but geminiapi is missing.",
                "Add your Gemini helper module back when ready.",
            ]
        }

    club_recommendations = geminiapi.get_club_recommendations(profile.about)
    return {"clubs": club_recommendations}


@app.post("/tts")
def tts(payload: TTSRequest):
    if not ELEVENLABS_API_KEY:
        raise HTTPException(status_code=500, detail="ELEVENLABS_API_KEY is not configured")

    url = (
        f"{ELEVENLABS_BASE_URL}/v1/text-to-speech/{ELEVENLABS_VOICE_ID}/stream"
        f"?output_format={ELEVENLABS_OUTPUT_FORMAT}"
    )

    headers = {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
        "Accept": "audio/mpeg",
    }

    body = {
        "text": payload.text,
        "model_id": ELEVENLABS_MODEL_ID,
    }

    try:
        response = requests.post(url, headers=headers, json=body, timeout=60)
    except requests.RequestException as exc:
        raise HTTPException(status_code=502, detail=f"TTS request failed: {exc}") from exc

    if not response.ok:
        raise HTTPException(status_code=response.status_code, detail=response.text)

    return StreamingResponse(io.BytesIO(response.content), media_type="audio/mpeg")


@app.post("/stt")
async def stt(audio: UploadFile = File(...)):
    if not ELEVENLABS_API_KEY:
        raise HTTPException(status_code=500, detail="ELEVENLABS_API_KEY is not configured")

    audio_bytes = await audio.read()

    url = f"{ELEVENLABS_BASE_URL}/v1/speech-to-text"
    headers = {
        "xi-api-key": ELEVENLABS_API_KEY,
    }
    files = {
        "file": (
            audio.filename or "recording.webm",
            audio_bytes,
            audio.content_type or "audio/webm",
        )
    }
    data = {
        "model_id": "scribe_v2",
    }

    try:
        response = requests.post(url, headers=headers, files=files, data=data, timeout=90)
    except requests.RequestException as exc:
        raise HTTPException(status_code=502, detail=f"STT request failed: {exc}") from exc

    if not response.ok:
        raise HTTPException(status_code=response.status_code, detail=response.text)

    result = response.json()
    return {
        "text": result.get("text", ""),
        "raw": result,
    }