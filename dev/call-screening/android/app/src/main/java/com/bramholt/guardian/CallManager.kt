package com.bramholt.guardian

import android.content.Context
import android.util.Log
import com.twilio.voice.Call
import com.twilio.voice.CallException
import com.twilio.voice.CallInvite
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

/**
 * App-wide holder for the one active call. The SERVER is the brain (transcript + Claude);
 * this is the ACTUATOR: while a call is connected it polls /status, and on "scam" it
 * disconnects the call and tells the UI to warn Jim.
 */
object CallManager {
    private const val TAG = "CallManager"
    private val scope = CoroutineScope(Dispatchers.Main + SupervisorJob())

    private var appContext: Context? = null
    var invite: CallInvite? = null
        private set
    private var call: Call? = null
    private var pollJob: Job? = null

    var listener: Listener? = null

    interface Listener {
        /** "incoming" | "connecting" | "screening" | "ended" */
        fun onState(state: String)
        /** We judged it a scam and hung up — show/play Jim the reassurance. */
        fun onScamDetected(reason: String)
    }

    val callerLabel: String
        get() = invite?.from ?: "Unknown caller"

    fun setIncoming(context: Context, ci: CallInvite) {
        appContext = context.applicationContext
        invite = ci
        listener?.onState("incoming")
    }

    fun accept(context: Context) {
        val ci = invite ?: return
        appContext = context.applicationContext
        listener?.onState("connecting")
        CallForegroundService.start(appContext!!)
        call = ci.accept(appContext!!, callListener)
    }

    fun reject(context: Context) {
        invite?.reject(context.applicationContext)
        finishCall()
    }

    fun hangUp() {
        call?.disconnect() // onDisconnected() will tidy up
    }

    private val callListener = object : Call.Listener {
        override fun onRinging(call: Call) {}
        override fun onConnectFailure(call: Call, e: CallException) {
            Log.w(TAG, "connect failure: ${e.message}")
            finishCall()
        }

        override fun onConnected(call: Call) {
            listener?.onState("screening")
            startPolling()
        }

        override fun onReconnecting(call: Call, e: CallException) {}
        override fun onReconnected(call: Call) {}

        override fun onDisconnected(call: Call, e: CallException?) {
            finishCall()
        }
    }

    private fun startPolling() {
        val sid = call?.sid ?: invite?.callSid ?: return
        pollJob?.cancel()
        pollJob = scope.launch {
            while (isActive) {
                val status = withContext(Dispatchers.IO) {
                    runCatching { Api.fetchStatus(sid) }.getOrNull()
                }
                if (status?.status == "scam") {
                    call?.disconnect()
                    listener?.onScamDetected(status.reason ?: "This call looked like a scam.")
                    break
                }
                delay(Config.POLL_INTERVAL_MS)
            }
        }
    }

    private fun finishCall() {
        pollJob?.cancel(); pollJob = null
        invite = null
        call = null
        appContext?.let { CallForegroundService.stop(it) }
        listener?.onState("ended")
    }
}
