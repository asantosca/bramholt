# 0005 — Jim's Android app is a Twilio Voice softphone

- **Date:** 2026-06-25
- **Status:** Accepted

## Context
The MVP server (0004) screens a live call and exposes `/status/:callSid` and `/token`. Jim
needs a phone app that (a) receives the call so the server can hear it, and (b) acts on the
server's verdict. Per 0003, Jim's is the only native app.

## Decision
Build a **native Android app (Kotlin)** under `dev/call-screening/android/` that is a
**Twilio Programmable Voice softphone**:

- **VoIP, not the system dialer.** Jim answers *in the app*, so the call's audio is on the
  app's data leg — which is what lets the server's `<Stream>` hear and transcribe it. (An app
  that only controlled the native dialer couldn't be screened.)
- **FCM push wakes the app.** Twilio sends an FCM push on an incoming call;
  `FirebaseMessagingService` → `Voice.handleMessage` → `CallInvite` → a full-screen-intent
  notification opens the call screen, even on the lock screen.
- **Server is the brain, app is the actuator.** While connected, the app polls
  `/status/:callSid` (key = `CallInvite.getCallSid()`); on `scam` it calls `Call.disconnect()`
  and reassures Jim on screen and via TextToSpeech. This is the founder's brain/actuator split
  from 0004 — it avoids redirecting a live call's TwiML to the right leg.
- **A foreground service** (`foregroundServiceType="microphone"`) keeps the mic alive during a
  call on Android 14+.

**Pinned facts:** `com.twilio:voice-android:6.10.+` (6.x `Voice.register(token, FCM, fcmToken,
listener)` — no Context, FCM channel); Firebase BoM `33.7.0`; google-services `4.4.2`;
`minSdk 26`, target/compile `34`. Package `com.bramholt.guardian`.

## Consequences
- (+) Completes the end-to-end PoC: real call → screened → dropped-and-reassured, or voicemail.
- (+) No SIM needed to test (VoIP over WiFi); real carrier-forwarding stays a separate concern.
- (−) Requires a Firebase project + a Twilio FCM Push Credential + TwiML App — real setup steps,
  documented in the app README.
- (−) Polling adds ~1.5s latency on top of the (already few-second) detection lag. Acceptable
  for a PoC; a server→app push/WebSocket would tighten it later.
- (−) `google-services.json` and the ngrok URL are per-developer/per-run; both are hand-set.
- Builds on [[0003-kara-web-jim-app]] and [[0004-call-screening-mvp-architecture]].
