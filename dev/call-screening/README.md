# Call-screening MVP (proof of concept)

Bramholt's core promise, made real and small: a phone call comes in, we listen live,
and if it's a scam we end it before the money's gone. This is a **proof of concept** —
not scalable, not production. It should *run*.

> Built **server-first** (see `company/decisions/0004-call-screening-mvp-architecture.md`).
> The Twilio + Whisper + Claude pipeline works today with any phone calling the Twilio
> number. The Android softphone app comes next, on top of the same server.

## Architecture

```
Caller ─► Twilio number ─► POST /voice/test  (or /voice/incoming once the app exists)
            │                   │
            │                   └─ TwiML: <Start><Stream wss://…/media>  + answer
            ▼
        ngrok ─► local Node server
            │
        WS /media: μ-law 8k ─► decode ─► upsample 16k ─► Whisper (local) ─► transcript
            │
        every ~4s: Claude judges {scam, confidence, reason}
            │
        scam ≥ threshold ─► status='scam' ─► drop caller leg (Twilio REST)
                                              └─ Jim's app, polling /status, drops his
                                                 leg + warns him (app phase)
        no answer (incoming) ─► <Record> voicemail ─► download ─► Whisper ─► Claude ─► logged
```

**Server is the brain** (transcript + Claude). **App is the actuator** (polls `/status`,
hangs up, warns Jim). That split avoids the fragile "redirect a live call to the right leg"
problem.

## What's here

| Path | Purpose |
|------|---------|
| `server/` | The Node server: Twilio webhooks, Media Streams WS, Claude scam judgement. |
| `whisper-service/` | Warm Python sidecar (faster-whisper) — the default transcription engine. |
| `android/` | _(next)_ Jim's Twilio Voice softphone app. |

## Prerequisites

- **Node 18+**
- **Python 3.9+** for the Whisper sidecar (`pip install -r whisper-service/requirements.txt`)
- **ngrok** (free tier is fine) — gives Twilio a public https/wss URL to your laptop
- A **Twilio** account with a voice-capable number
- An **Anthropic** API key

> Transcription defaults to the **faster-whisper** Python sidecar (`whisper-service/`),
> which keeps the model warm between windows. `whisper.cpp` is an alternative via
> `WHISPER_MODE=cli` — see `server/.env.example`.

## Run it (server-first)

```bash
# 1) start the Whisper sidecar (keeps the model warm) in its own terminal
cd dev/call-screening/whisper-service
python -m venv .venv && .venv/Scripts/activate   # macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
uvicorn app:app --host 127.0.0.1 --port 8000

# 2) start the server
cd dev/call-screening/server
npm install
cp .env.example .env        # then fill it in

# 3) start ngrok in another terminal
ngrok http 3000             # copy the https URL into PUBLIC_URL in .env

# 4) start the server
npm start
```

Then in the **Twilio console**, set your number's *"A call comes in"* webhook to:

```
POST  https://<your-ngrok>.ngrok-free.app/voice/test
```

**Call the Twilio number** from any phone and play a scammer — e.g. *"This is the IRS,
there's a warrant for your arrest, pay now with gift cards."* Within a few seconds the
server transcribes, Claude judges it a scam, and the call is dropped with a spoken
Bramholt warning. Watch the server logs for `[judge]` and `[drop]` lines.

A normal, friendly call should **not** be dropped — that false-positive guard matters
as much as the catch.

## Endpoints

| Method + path | Role |
|---|---|
| `POST /voice/test` | Server-first: answer, stream to Whisper, listen. **Use this now.** |
| `POST /voice/incoming` | App phase: stream + ring Jim's app; voicemail on no-answer. |
| `POST /voice/after-dial` | Routes to voicemail if Jim didn't pick up. |
| `POST /voice/voicemail-recording` | Recording webhook → transcribe + judge. |
| `GET  /status/:callSid` | Polled by the app: `{ status, verdict }`. |
| `GET  /token?identity=jim` | Mints the Android Voice SDK access token (app phase). |
| `GET  /health` | Liveness. |

## Known MVP limits (on purpose)

- **Whisper is batch, not streaming.** We re-transcribe a rolling window every few
  seconds, so detection lags a scam pitch by a handful of seconds. Fine for PoC.
- **In-memory state** — a restart forgets every call.
- **No auth** on `/status` or `/token` yet.
- **No SIM needed** to test the app later: the Voice SDK rings over WiFi/data. Real
  carrier-forwarding from Jim's own number is a separate, real-world step we skip by
  calling the Twilio number directly.
