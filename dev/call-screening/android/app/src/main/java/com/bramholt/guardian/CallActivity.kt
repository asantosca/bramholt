package com.bramholt.guardian

import android.os.Build
import android.os.Bundle
import android.speech.tts.TextToSpeech
import android.view.View
import android.widget.Button
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import java.util.Locale

/**
 * The live-call screen. Shows the incoming call, lets Jim answer or decline, then shows
 * "screening…" while the server listens. If the server flags a scam, CallManager hangs up
 * and this screen reassures Jim (on screen + spoken aloud).
 */
class CallActivity : AppCompatActivity(), CallManager.Listener, TextToSpeech.OnInitListener {

    private lateinit var title: TextView
    private lateinit var subtitle: TextView
    private lateinit var acceptBtn: Button
    private lateinit var declineBtn: Button
    private lateinit var hangupBtn: Button

    private lateinit var tts: TextToSpeech
    private var scamShown = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        showWhenLocked()
        setContentView(R.layout.activity_call)

        title = findViewById(R.id.callTitle)
        subtitle = findViewById(R.id.callSubtitle)
        acceptBtn = findViewById(R.id.acceptBtn)
        declineBtn = findViewById(R.id.declineBtn)
        hangupBtn = findViewById(R.id.hangupBtn)
        tts = TextToSpeech(this, this)

        subtitle.text = CallManager.callerLabel

        acceptBtn.setOnClickListener {
            CallManager.accept(this)
            showScreening()
        }
        declineBtn.setOnClickListener {
            CallManager.reject(this)
            finish()
        }
        hangupBtn.setOnClickListener {
            CallManager.hangUp()
            finish()
        }

        showIncoming()
    }

    override fun onResume() {
        super.onResume()
        CallManager.listener = this
    }

    override fun onPause() {
        super.onPause()
        if (CallManager.listener === this) CallManager.listener = null
    }

    override fun onDestroy() {
        tts.shutdown()
        super.onDestroy()
    }

    override fun onInit(status: Int) {
        if (status == TextToSpeech.SUCCESS) tts.language = Locale.US
    }

    // ---- CallManager.Listener -------------------------------------------------
    override fun onState(state: String) = runOnUiThread {
        when (state) {
            "screening" -> showScreening()
            "ended" -> if (!scamShown) finish() // keep the scam reassurance up until Jim dismisses it
        }
    }

    override fun onScamDetected(reason: String) = runOnUiThread {
        scamShown = true
        title.text = getString(R.string.call_scam_title)
        subtitle.text = getString(R.string.call_scam_body)
        acceptBtn.visibility = View.GONE
        declineBtn.visibility = View.GONE
        hangupBtn.visibility = View.VISIBLE
        hangupBtn.text = getString(R.string.btn_done)
        hangupBtn.setOnClickListener { finish() }
        tts.speak(getString(R.string.call_scam_spoken), TextToSpeech.QUEUE_FLUSH, null, "scam")
    }

    // ---- UI states ------------------------------------------------------------
    private fun showIncoming() {
        title.text = getString(R.string.call_incoming)
        acceptBtn.visibility = View.VISIBLE
        declineBtn.visibility = View.VISIBLE
        hangupBtn.visibility = View.GONE
    }

    private fun showScreening() {
        title.text = getString(R.string.call_screening)
        acceptBtn.visibility = View.GONE
        declineBtn.visibility = View.GONE
        hangupBtn.visibility = View.VISIBLE
        hangupBtn.text = getString(R.string.btn_hangup)
    }

    private fun showWhenLocked() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true)
            setTurnScreenOn(true)
        }
    }
}
