import os
import json
import base64
from pathlib import Path
from typing import AsyncIterator

from dotenv import load_dotenv
load_dotenv(Path(__file__).parent / ".env")

import anthropic
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, FileResponse
from pydantic import BaseModel, Field

app = FastAPI(title="Brain API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)

client = anthropic.AsyncAnthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
MODEL = "claude-sonnet-4-6"

READING_LEVEL_DESCRIPTIONS = {
    1: "elementary school level (ages 6-10): very simple words, very short sentences, no jargon",
    2: "middle school level (ages 11-13): everyday vocabulary, simple sentence structure",
    3: "high school level (ages 14-18): standard vocabulary, clear sentences",
    4: "college level: academic vocabulary, complex ideas allowed",
    5: "professional level: preserve all complexity and terminology exactly",
}


def sse_chunk(text: str) -> str:
    return f"data: {json.dumps({'text': text})}\n\n"


def sse_done() -> str:
    return "data: [DONE]\n\n"


async def stream_to_sse(stream: anthropic.AsyncMessageStream) -> AsyncIterator[str]:
    async with stream as s:
        async for event in s:
            if (
                event.type == "content_block_delta"
                and event.delta.type == "text_delta"
            ):
                yield sse_chunk(event.delta.text)
    yield sse_done()


class ReadRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=10_000)


class SimplifyRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=10_000)
    reading_level: int = Field(default=3, ge=1, le=5)

    @property
    def level_description(self) -> str:
        return READING_LEVEL_DESCRIPTIONS.get(self.reading_level, READING_LEVEL_DESCRIPTIONS[3])


class TranslateRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=10_000)
    target_language: str = Field(default="en", max_length=10)


class DefineRequest(BaseModel):
    word: str = Field(..., min_length=1, max_length=100)


MEDIA_TYPE_MAP = {
    "image/jpeg": "image/jpeg",
    "image/jpg": "image/jpeg",
    "image/png": "image/png",
    "image/gif": "image/gif",
    "image/webp": "image/webp",
}


@app.post("/api/ocr")
async def extract_text(file: UploadFile = File(...)):
    """Extract text from an uploaded image using Claude vision."""
    raw_type = (file.content_type or "").split(";")[0].strip().lower()
    media_type = MEDIA_TYPE_MAP.get(raw_type)

    # Fall back to sniffing by filename extension if content-type is missing
    if not media_type and file.filename:
        ext = file.filename.rsplit(".", 1)[-1].lower()
        media_type = {"jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png",
                      "gif": "image/gif", "webp": "image/webp"}.get(ext)

    if not media_type:
        raise HTTPException(status_code=415, detail=f"Unsupported image type '{raw_type}'. Use JPEG, PNG, or WebP.")

    image_data = await file.read()
    if len(image_data) > 5 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Image too large. Maximum size is 5 MB.")
    if len(image_data) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    encoded = base64.standard_b64encode(image_data).decode("utf-8")

    try:
        message = await client.messages.create(
            model=MODEL,
            max_tokens=1024,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image",
                            "source": {"type": "base64", "media_type": media_type, "data": encoded},
                        },
                        {
                            "type": "text",
                            "text": (
                                "Extract all visible text from this image exactly as it appears. "
                                "Preserve line breaks where they are meaningful. "
                                "Return only the extracted text — no commentary, no markdown."
                            ),
                        },
                    ],
                }
            ],
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Claude API error: {e}")

    text = message.content[0].text.strip() if message.content else ""
    return {"text": text}


WEB_APP = Path(__file__).parent.parent / "web-app.html"


@app.get("/")
async def serve_web_app():
    return FileResponse(WEB_APP, media_type="text/html")


@app.get("/health")
async def health():
    return {"status": "ok", "model": MODEL}


@app.post("/api/read")
async def read_text(req: ReadRequest):
    """Clean and lightly format OCR text for reading aloud."""
    system = (
        "You are a reading assistant. Your only job is to clean up OCR-captured text "
        "for natural audio playback. Fix obvious OCR errors, merge broken lines, "
        "and remove noise characters. Preserve the original meaning and wording exactly. "
        "Return only the cleaned text — no commentary, no markdown."
    )
    stream = client.messages.stream(
        model=MODEL,
        max_tokens=2048,
        system=system,
        messages=[{"role": "user", "content": req.text}],
    )
    return StreamingResponse(
        stream_to_sse(stream),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@app.post("/api/simplify")
async def simplify_text(req: SimplifyRequest):
    """Rewrite text at the user's target reading level."""
    level_desc = req.level_description
    system = (
        f"You are a reading accessibility assistant. Rewrite the provided text at {level_desc}. "
        "Keep all the key information. Do not add information that wasn't there. "
        "Write in plain prose — no bullet points, no headers, no markdown. "
        "Return only the rewritten text."
    )
    stream = client.messages.stream(
        model=MODEL,
        max_tokens=2048,
        system=system,
        messages=[{"role": "user", "content": req.text}],
    )
    return StreamingResponse(
        stream_to_sse(stream),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@app.post("/api/translate")
async def translate_text(req: TranslateRequest):
    """Translate text into the user's target language."""
    language_map = {
        "en": "English", "es": "Spanish", "fr": "French", "pt": "Portuguese",
        "zh": "Simplified Chinese", "ar": "Arabic", "hi": "Hindi",
        "ko": "Korean", "ja": "Japanese", "de": "German",
    }
    target = language_map.get(req.target_language, req.target_language)
    system = (
        f"You are a translation assistant. Translate the provided text into {target}. "
        "Preserve the meaning and natural tone. Do not add commentary. "
        "Return only the translated text."
    )
    stream = client.messages.stream(
        model=MODEL,
        max_tokens=2048,
        system=system,
        messages=[{"role": "user", "content": req.text}],
    )
    return StreamingResponse(
        stream_to_sse(stream),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@app.post("/api/define")
async def define_word(req: DefineRequest):
    """Return a plain-English definition and usage example for a word."""
    system = (
        "You are a vocabulary assistant. For the given word, provide: "
        "1) A clear, plain-English definition in one or two sentences. "
        "2) A single natural usage example sentence. "
        "Format: definition on the first line, then a blank line, then 'Example: [sentence]'. "
        "No markdown, no extra commentary."
    )
    stream = client.messages.stream(
        model=MODEL,
        max_tokens=256,
        system=system,
        messages=[{"role": "user", "content": req.word}],
    )
    return StreamingResponse(
        stream_to_sse(stream),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
