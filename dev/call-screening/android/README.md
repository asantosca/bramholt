# Bramholt — Jim's Android app (softphone)

Jim's side of the call-screening MVP: a **Twilio Voice softphone**. A call to the Twilio
number rings this app via FCM push; Jim answers *in the app* so the audio rides the app's
data leg (which is how the server gets to hear and screen it). While the call is live the
app polls the server's `/status` endpoint; if the server flags a **scam**, the app hangs up
and reassures Jim — on screen and spoken aloud.

> **Server is the brain, app is the actuator.** All detection lives in the server
> (`../server` + `../whisper-service`). This app just registers, answers, polls, and acts.
> See `company/decisions/0004-call-screening-mvp-architecture.md` and `0005-…`.

## Screens

- **MainActivity** — registers the device, shows "You're protected."
- **CallActivity** — incoming → answer/decline → "screening…" → (scam) reassurance. Opens
  over the lock screen via a full-screen-intent notification.

## What you need

- **Android Studio** (Koala or newer) and an **Android phone** to sideload onto. No SIM
  required — the Voice SDK rings over WiFi/data.
- The **server** running and reachable (its ngrok https URL).
- A **Firebase** project (for FCM).
- A **Twilio Push Credential (FCM)** wired to your TwiML App.

## Setup

### 1. Firebase / FCM
1. Create a Firebase project, add an **Android app** with package **`com.bramholt.guardian`**.
2. Download its **`google-services.json`** into **`app/google-services.json`**
   (a template is in `app/google-services.json.example`; the real file is gitignored).
3. In Firebase → Project settings → **Service accounts**, generate a **private key** JSON —
   you'll give this to Twilio next.

### 2. Twilio Push Credential + TwiML App
1. Twilio Console → Voice → **Push Credentials** → create an **FCM** credential, uploading
   the Firebase **service account JSON** from step 1.3. Note its SID (`CRxxxx`).
2. Twilio Console → Voice → **TwiML Apps** → create one; set its **Voice Request URL** to
   `https://<your-ngrok>/voice/incoming` (POST). Note its SID (`APxxxx`).
3. Put both SIDs in the **server's** `.env` (`TWILIO_TWIML_APP_SID`, and the push credential
   is referenced when minting tokens). The server's `/token` endpoint mints the access token
   the app registers with.

### 3. Point the app at your server
Edit **`app/src/main/java/com/bramholt/guardian/Config.kt`**:
```kotlin
const val SERVER_BASE_URL = "https://<your-ngrok>.ngrok-free.app"
```

### 4. Build & run
Open `dev/call-screening/android` in Android Studio, let Gradle sync, and Run on your phone.
Grant the microphone + notification permissions when asked. You should see
**"You're protected."**

## Try it

1. Start `whisper-service`, then the `server`, then `ngrok` — and set the TwiML App's Voice
   URL to `/voice/incoming` (not `/voice/test`, which is the no-app path).
2. **Call the Twilio number.** Jim's phone rings (full-screen). Tap **Answer**.
3. Play a scammer. Within a few seconds the server flags it, the app hangs up, and Jim sees
   *"We stopped this call — it looked like a scam. You're safe."* and hears it spoken.
4. A normal, friendly call is **not** dropped; Jim can hang up himself with **Hang up**.
5. Don't answer → after ~20s the call falls through to voicemail, which the server
   transcribes and judges (watch the server logs).

## Versions / facts baked in

- Twilio Voice `com.twilio:voice-android:6.10.+` (6.x `Voice.register(token, FCM, fcmToken, listener)`).
- Firebase BoM `33.7.0` + `firebase-messaging`; google-services plugin `4.4.2`.
- `minSdk 26`, `compileSdk/targetSdk 34`. Android 14+ needs the
  `FOREGROUND_SERVICE_MICROPHONE` permission + `foregroundServiceType="microphone"` (both set).
- Scam poll key = `CallInvite.getCallSid()`, matched against the server's `/status/:callSid`.

## Known MVP limits (on purpose)

- No outgoing calls, no call history, no settings — incoming screening only.
- One call at a time; state is in-memory.
- `SERVER_BASE_URL` is hand-edited (ngrok URL changes each run).
- The reassurance uses the device's built-in TextToSpeech voice.
