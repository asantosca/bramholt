# Call-screening MVP — bring-up roadmap

Everything you need to take this from a fresh Windows 11 machine to a **working call**:
ring a Twilio number, hear it screened live, watch a scam get dropped, and a real
voicemail get judged. Work top to bottom. There's a checklist at the end.

The system is three running pieces plus two phones:

```
[caller's phone] ─► Twilio number ─► ngrok ─► Node server ─┬─► Whisper sidecar (transcribe)
                                                           └─► Claude (judge scam)
                                          incoming call ─► FCM push ─► [Jim's Android app]
```

> Build it in **two parts**. **Part A** (server + Whisper + Claude) is provable from *any*
> phone — do this first. **Part B** adds Jim's Android app. Don't start Part B until Part A
> screens a call.

---

## 1. Accounts & keys

You'll collect a handful of secrets. Section 5 has the "what goes where" table — for now,
just create each and keep the values somewhere safe.

### 1a. Anthropic (Claude) — the scam judge
1. Sign in at **console.anthropic.com**.
2. **Settings → API keys → Create key**. Copy it (starts `sk-ant-…`).
3. Add billing/credit if the account is new.
4. → server `.env`: `ANTHROPIC_API_KEY`.

### 1b. Twilio — phone number + voice
1. Sign up at **twilio.com**, verify your own phone.
2. **Phone Numbers → Buy a number** — a local number with **Voice** capability.
3. From the **Console dashboard**, copy **Account SID** (`AC…`) and **Auth Token**.
4. **Account → API keys & tokens → Create API key** (Standard). Copy the **SID** (`SK…`)
   and **Secret** (shown once). These sign the app's Voice access tokens.
5. *(Part B)* **Voice → TwiML Apps → Create**. Leave the Voice URL blank for now; you'll set
   it to `https://<ngrok>/voice/incoming` in step 4. Copy its **SID** (`AP…`).
6. *(Part B, after Firebase)* **Voice → Push Credentials → Create → FCM**, upload the
   Firebase **service-account JSON** (step 1c.4). Copy its **SID** (`CR…`).
   → server `.env`: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_NUMBER`,
   `TWILIO_API_KEY_SID`, `TWILIO_API_KEY_SECRET`, `TWILIO_TWIML_APP_SID`,
   `TWILIO_PUSH_CREDENTIAL_SID`.

### 1c. Firebase — wakes Jim's app (Part B only)
1. **console.firebase.google.com → Add project**.
2. **Add app → Android**, package name **`com.bramholt.guardian`** (must match exactly).
3. Download **`google-services.json`** → save as
   `dev/call-screening/android/app/google-services.json` (gitignored).
4. **Project settings → Service accounts → Generate new private key** → a JSON file. This is
   what you upload to Twilio in step 1b.6 (do **not** commit it).

---

## 2. Local tools to install (Windows 11)

`winget` commands given; manual download links in parentheses. Open a fresh terminal after
installing so `PATH` updates.

| Tool | Why | Install |
|------|-----|---------|
| **Node.js 18+** | runs the server | `winget install OpenJS.NodeJS.LTS` (nodejs.org) |
| **Python 3.10+** | runs the Whisper sidecar | `winget install Python.Python.3.12` (python.org — tick "Add to PATH") |
| **ngrok** | public URL to your laptop | `winget install ngrok.ngrok` (ngrok.com) then `ngrok config add-authtoken <token>` |
| **Android Studio** | builds + runs Jim's app | `winget install Google.AndroidStudio` (developer.android.com/studio) |

**About Gradle, Kotlin, and the JDK:** you don't install these separately. **Android Studio
bundles a JDK, the Kotlin compiler, and the Android SDK**, and this project ships a *Gradle
wrapper* (`gradle-wrapper.properties`) so Android Studio downloads the right Gradle (8.7)
automatically on first sync. Optional if you ever want them standalone:
`winget install EclipseAdoptium.Temurin.17.JDK`.

Verify:
```powershell
node -v        # v18+ or v20+
python --version
ngrok version
```

---

## 3. Part A — stand up the server (provable from any phone)

Three terminals.

**Terminal 1 — Whisper sidecar** (keeps the model warm):
```powershell
cd dev/call-screening/whisper-service
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app:app --host 127.0.0.1 --port 8000
# first run downloads the model; check: curl http://127.0.0.1:8000/health
```

**Terminal 2 — ngrok**:
```powershell
ngrok http 3000
# copy the https URL, e.g. https://ab12cd34.ngrok-free.app
```

**Terminal 3 — the server**:
```powershell
cd dev/call-screening/server
npm install
copy .env.example .env      # then edit .env (see section 5)
# set PUBLIC_URL to the ngrok https URL, fill in ANTHROPIC + TWILIO basics
npm start                   # "listening on :3000"
```

**Point the Twilio number at the test endpoint:** Console → your number → *Voice → A call
comes in* → **Webhook**, `POST  https://<ngrok>/voice/test`. Save.

**Smoke test:** call the number from any phone. Say a scam line ("This is the IRS, pay with
gift cards now"). Within a few seconds the server logs `[judge] scam=true …` then `[drop]`,
and the call ends with a spoken Bramholt warning. Try a friendly call too — it should **not**
drop. ✅ Part A done.

---

## 4. Part B — Jim's Android app

Do steps 1c (Firebase), 1b.5 (TwiML App), 1b.6 (Push Credential) if you haven't.

1. **Switch the Twilio number's Voice webhook** from `/voice/test` to
   `POST https://<ngrok>/voice/incoming`. Also set the **TwiML App's** Voice Request URL to
   the same `/voice/incoming`.
2. Confirm the server `.env` now has `TWILIO_API_KEY_SID`, `TWILIO_API_KEY_SECRET`,
   `TWILIO_TWIML_APP_SID`, `TWILIO_PUSH_CREDENTIAL_SID`. Restart the server.
3. Drop `google-services.json` into `android/app/`.
4. Edit `android/app/src/main/java/com/bramholt/guardian/Config.kt`:
   ```kotlin
   const val SERVER_BASE_URL = "https://<your-ngrok>.ngrok-free.app"
   ```
5. Open `dev/call-screening/android` in **Android Studio**. Let Gradle sync (it pulls Gradle,
   Kotlin, the SDK, and dependencies — first sync is slow). Fix any version nag it surfaces.
6. Plug in an Android phone (USB debugging on) or use an emulator with Google Play. **Run**.
   Grant microphone + notification permissions. You should see **"You're protected."**
7. **Call the Twilio number.** Jim's phone rings full-screen → **Answer** → "screening…".
   Play a scammer → the app hangs up and shows/says *"We stopped this call… you're safe."*
   Don't answer for ~20s → it goes to voicemail, which the server transcribes and judges. ✅

---

## 5. Where every secret goes

| Value | From | Goes to |
|-------|------|---------|
| `ANTHROPIC_API_KEY` | 1a | `server/.env` |
| `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` | 1b.3 | `server/.env` |
| `TWILIO_NUMBER` | 1b.2 | `server/.env` |
| `TWILIO_API_KEY_SID`, `TWILIO_API_KEY_SECRET` | 1b.4 | `server/.env` |
| `TWILIO_TWIML_APP_SID` | 1b.5 | `server/.env` |
| `TWILIO_PUSH_CREDENTIAL_SID` | 1b.6 | `server/.env` |
| `PUBLIC_URL` | ngrok (step 3) | `server/.env` |
| `google-services.json` | 1c.3 | `android/app/google-services.json` |
| Firebase service-account JSON | 1c.4 | uploaded to Twilio (1b.6) — not in repo |
| `SERVER_BASE_URL` | ngrok | `android/.../Config.kt` |

> **ngrok's free URL changes every restart.** Each time, update `PUBLIC_URL` in `.env`, the
> Twilio webhook + TwiML App URL, and `Config.kt`. A reserved domain (paid) avoids this.

---

## 6. Troubleshooting

- **No `[judge]` logs on a call** → the media stream never connected. Check `PUBLIC_URL` is the
  current ngrok https URL and the server restarted after editing `.env`.
- **`whisper service 5xx` / empty transcripts** → sidecar not running on :8000, or the venv
  isn't activated. Hit `http://127.0.0.1:8000/health`.
- **Claude errors** → bad/throttled `ANTHROPIC_API_KEY`, or no billing on a new account.
- **App rings but never gets a scam verdict** → `SERVER_BASE_URL` in `Config.kt` is stale, or
  the phone can't reach ngrok. Open that URL in the phone's browser.
- **App never rings** → Push Credential not attached: confirm `TWILIO_PUSH_CREDENTIAL_SID` is
  set, the token was re-minted (restart server), and the TwiML App Voice URL is `/voice/incoming`.
- **Gradle sync fails** → let Android Studio install the suggested SDK/Build-Tools; bump the
  Twilio Voice version to the exact latest if `6.10.+` won't resolve.

---

## 7. Master checklist

**Accounts & keys**
- [ ] Anthropic API key, with billing
- [ ] Twilio account + voice number
- [ ] Twilio Account SID + Auth Token
- [ ] Twilio API Key SID + Secret
- [ ] Twilio TwiML App (SID) — *Part B*
- [ ] Firebase project + Android app (`com.bramholt.guardian`) — *Part B*
- [ ] `google-services.json` saved into `android/app/` — *Part B*
- [ ] Firebase service-account JSON → uploaded as Twilio FCM Push Credential (SID) — *Part B*

**Local tools**
- [ ] Node.js 18+
- [ ] Python 3.10+
- [ ] ngrok (+ authtoken)
- [ ] Android Studio (bundles JDK + Kotlin + SDK; Gradle via wrapper) — *Part B*

**Part A — server**
- [ ] Whisper sidecar running on :8000
- [ ] ngrok running, `PUBLIC_URL` set in `.env`
- [ ] `.env` filled (Anthropic + Twilio basics)
- [ ] Twilio number Voice webhook → `/voice/test`
- [ ] Scam call dropped; friendly call not dropped

**Part B — app**
- [ ] Twilio webhook + TwiML App URL → `/voice/incoming`
- [ ] `.env` has API key, TwiML App, Push Credential; server restarted
- [ ] `Config.kt` `SERVER_BASE_URL` set
- [ ] App builds, runs, shows "You're protected"
- [ ] Live call: ring → answer → scam dropped + reassurance
- [ ] No-answer → voicemail transcribed + judged
