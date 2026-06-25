"""Warm faster-whisper sidecar for the call-screening server.

Loads the model once and keeps it in memory, so the Node server can transcribe
a rolling window every few seconds without paying a model-reload cost each time.

The Node server sends raw PCM16 little-endian, mono, 16 kHz audio bytes to
POST /transcribe and gets back {"text": "..."}.

Run:  uvicorn app:app --host 127.0.0.1 --port 8000
"""
import os

import numpy as np
from fastapi import FastAPI, Request
from faster_whisper import WhisperModel

# base.en is a good speed/accuracy default on CPU. Bump to small.en / medium.en
# for accuracy if your machine can take it. On an NVIDIA GPU set FW_DEVICE=cuda
# and FW_COMPUTE=float16 for a big speedup.
MODEL = os.environ.get("FW_MODEL", "base.en")
DEVICE = os.environ.get("FW_DEVICE", "cpu")
COMPUTE = os.environ.get("FW_COMPUTE", "int8")

app = FastAPI(title="bramholt-whisper")
model = WhisperModel(MODEL, device=DEVICE, compute_type=COMPUTE)


@app.get("/health")
def health():
    return {"ok": True, "model": MODEL, "device": DEVICE, "compute": COMPUTE}


@app.post("/transcribe")
async def transcribe(request: Request):
    raw = await request.body()  # PCM16 LE, mono, 16 kHz
    if not raw:
        return {"text": ""}
    audio = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768.0
    if audio.size == 0:
        return {"text": ""}
    # beam_size=1 keeps it fast; vad_filter drops silence so short windows stay quick.
    segments, _info = model.transcribe(audio, language="en", beam_size=1, vad_filter=True)
    text = " ".join(seg.text.strip() for seg in segments).strip()
    return {"text": text}
