# Whisper sidecar (faster-whisper)

A tiny warm transcription service for the call-screening server. It loads a Whisper
model **once** and keeps it in memory, so the Node server can transcribe a rolling
window every few seconds without reloading the model each time.

This is the **default** transcription engine (`WHISPER_MODE=http` in the server's `.env`).
The alternative is `whisper.cpp` via `WHISPER_MODE=cli`.

## Why faster-whisper

`faster-whisper` (CTranslate2) is ~4× faster than the vanilla `openai-whisper` PyTorch
package and comparable to `whisper.cpp`, while being trivial to install on Windows
(`pip install`, no C++ build). Same models, int8 quantization, real-time-ish on CPU.

## Run

```bash
cd dev/call-screening/whisper-service
python -m venv .venv
# Windows:  .venv\Scripts\activate    |  macOS/Linux:  source .venv/bin/activate
pip install -r requirements.txt

uvicorn app:app --host 127.0.0.1 --port 8000
```

First start downloads the model (cached afterward). Check it's up:

```bash
curl http://127.0.0.1:8000/health
```

## Config (env vars)

| Var | Default | Notes |
|-----|---------|-------|
| `FW_MODEL` | `base.en` | `small.en` / `medium.en` for more accuracy if the machine can take it. |
| `FW_DEVICE` | `cpu` | Set `cuda` on an NVIDIA GPU. |
| `FW_COMPUTE` | `int8` | Use `float16` on GPU for a big speedup. |

The server reaches this at `WHISPER_SERVICE_URL` (default `http://127.0.0.1:8000`).

## API

`POST /transcribe` — body is raw **PCM16 little-endian, mono, 16 kHz** audio bytes.
Returns `{"text": "..."}`. (The Node server does the μ-law→PCM→16 kHz conversion before
sending.)
