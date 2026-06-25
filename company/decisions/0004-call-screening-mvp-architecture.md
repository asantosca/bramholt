# 0004 — Call-screening MVP architecture (Twilio + local Whisper + Claude)

- **Date:** 2026-06-25
- **Status:** Accepted

## Context
We need a runnable proof of concept of the core promise — listen on a live call and end
it if it's a scam — before investing in the full product. It must *run*, but need not be
scalable or production-grade.

## Decision
Build it **server-first** under `dev/call-screening/`, stack now chosen as **Node.js**
(supersedes the "dev/ stack TBD" placeholder for this work).

**Pipeline.** A call hits a **Twilio** number, which webhooks a local **Node** server
exposed via **ngrok**. TwiML forks the caller's audio to the server over a **Media Streams**
WebSocket. The server decodes μ-law 8 kHz, upsamples to 16 kHz, and runs **local Whisper
(whisper.cpp)** to transcribe a rolling window every ~4 s. **Claude** judges each window
`{scam, confidence, reason}`. Past a confidence threshold the server drops the caller leg
via the Twilio REST API.

**Brain/actuator split.** The **server is the brain** (holds transcript, runs Claude). The
**app is the actuator**: Jim's Android softphone polls `GET /status/:callSid`, and on `scam`
disconnects its own leg and warns Jim locally. This was the founder's call and it's better
than redirecting a live call's TwiML to the right leg — it sidesteps a fragile failure mode.

**Jim's app is a VoIP softphone** (Twilio Voice Android SDK): the audio rides the app's data
leg (so the server can hear it), and the app is woken by **FCM push**. Consistent with the
settled "forwarding not porting" decision — real calls reach Twilio via carrier forwarding
from Jim's number; for the PoC we simulate that by calling the Twilio number directly.

**No-answer → voicemail.** `<Dial>` to Jim's client times out → `<Record>`; the recording is
downloaded, transcribed, and judged scam/clear after the fact.

**Tools.** Local Whisper instead of a cloud STT (founder's call — keeps audio on-device and
removes a dependency). Default engine is a **warm `faster-whisper` Python sidecar**
(`whisper-service/`) that loads the model once and is reached over HTTP — comparable speed to
`whisper.cpp`, far easier to install on Windows, and no per-window model reload. `whisper.cpp`
remains available via `WHISPER_MODE=cli`. Claude for judgement (`claude-sonnet-4-6` default for
the in-call loop; `claude-opus-4-8` available for max quality).

## Consequences
- (+) End-to-end pipeline is testable today with any phone; no app needed to prove detection.
- (+) Keeps audio local (Whisper) and leans on a clean brain/actuator boundary.
- (+) Establishes Node as the server stack for `dev/`.
- (−) Whisper is batch, so live detection lags a scam pitch by a few seconds (acceptable for PoC).
- (−) In-memory state, no auth, single-call focus — all deliberate MVP cuts to revisit.
- Builds on [[0003-kara-web-jim-app]] (Jim = the only native app) and reinforces "signals not
  verdicts": Claude returns a confidence, and a real call is never dropped lightly.
- Next: the `android/` softphone (Voice SDK + FCM + `/status` polling) on top of this server.
