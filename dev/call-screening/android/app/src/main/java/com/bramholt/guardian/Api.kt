package com.bramholt.guardian

import okhttp3.OkHttpClient
import okhttp3.Request
import org.json.JSONObject
import java.util.concurrent.TimeUnit

/** Thin HTTP client for the call-screening server. Calls are blocking — run on Dispatchers.IO. */
object Api {
    private val client = OkHttpClient.Builder()
        .callTimeout(10, TimeUnit.SECONDS)
        .build()

    /** GET /token?identity=jim -> { token } (Twilio Voice access token JWT). */
    fun fetchAccessToken(): String {
        val req = Request.Builder()
            .url("${Config.SERVER_BASE_URL}/token?identity=${Config.IDENTITY}")
            .get()
            .build()
        client.newCall(req).execute().use { resp ->
            val body = resp.body?.string().orEmpty()
            if (!resp.isSuccessful) throw RuntimeException("token HTTP ${resp.code}")
            return JSONObject(body).getString("token")
        }
    }

    data class Status(val status: String, val reason: String?)

    /** GET /status/{callSid} -> { status, verdict:{reason} }. */
    fun fetchStatus(callSid: String): Status {
        val req = Request.Builder()
            .url("${Config.SERVER_BASE_URL}/status/$callSid")
            .get()
            .build()
        client.newCall(req).execute().use { resp ->
            val body = resp.body?.string().orEmpty()
            if (!resp.isSuccessful) return Status("unknown", null)
            val j = JSONObject(body)
            val reason = j.optJSONObject("verdict")?.optString("reason")
            return Status(j.optString("status", "unknown"), reason)
        }
    }
}
