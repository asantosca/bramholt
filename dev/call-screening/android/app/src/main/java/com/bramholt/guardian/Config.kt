package com.bramholt.guardian

object Config {
    // EDIT THIS: your server's public base URL — the ngrok https URL, no trailing slash.
    // Must match PUBLIC_URL in the server's .env.
    const val SERVER_BASE_URL = "https://your-subdomain.ngrok-free.app"

    // The Voice SDK client identity. Must match what the server mints in /token
    // and what the TwiML <Client> dials. "jim" by default.
    const val IDENTITY = "jim"

    // How often to ask the server "is this call a scam yet?" (ms).
    const val POLL_INTERVAL_MS = 1500L
}
