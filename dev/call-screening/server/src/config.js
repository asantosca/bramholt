import 'dotenv/config'

// Single source of config. Everything comes from .env (see .env.example).
export const config = {
  port: Number(process.env.PORT || 3000),

  // Your public ngrok https URL, no trailing slash, e.g. https://abc123.ngrok-free.app
  // Twilio reaches the server through this; we derive the wss:// media URL from it.
  publicUrl: (process.env.PUBLIC_URL || '').replace(/\/+$/, ''),

  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY,
    // Fast + cheap is the right call for an in-call polling loop. Bump to
    // claude-opus-4-8 if you want maximum judgement quality over speed.
    model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6',
  },

  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    number: process.env.TWILIO_NUMBER,
    // For the Android Voice SDK access token (app phase):
    apiKeySid: process.env.TWILIO_API_KEY_SID,
    apiKeySecret: process.env.TWILIO_API_KEY_SECRET,
    twimlAppSid: process.env.TWILIO_TWIML_APP_SID,
  },

  whisper: {
    // 'http' = warm Python sidecar (faster-whisper, default). 'cli' = whisper.cpp binary.
    mode: process.env.WHISPER_MODE || 'http',
    // Python sidecar (see ../../whisper-service). Keeps the model loaded between calls.
    serviceUrl: (process.env.WHISPER_SERVICE_URL || 'http://127.0.0.1:8000').replace(/\/+$/, ''),
    // Only used when mode='cli': path to the whisper.cpp binary and a model file.
    bin: process.env.WHISPER_BIN || 'whisper-cli',
    model: process.env.WHISPER_MODEL || 'models/ggml-base.en.bin',
  },

  // How much audio to accumulate before we transcribe + re-judge (ms).
  judgeIntervalMs: Number(process.env.JUDGE_INTERVAL_MS || 4000),
  // Confidence at/above which we treat Claude's verdict as "drop the call".
  scamThreshold: Number(process.env.SCAM_THRESHOLD || 0.7),
}

// wss base for <Stream>, derived from the ngrok https URL.
export function wsBase() {
  return config.publicUrl.replace(/^http/, 'ws')
}
