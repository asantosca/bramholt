package com.bramholt.guardian

import android.Manifest
import android.os.Build
import android.os.Bundle
import android.widget.TextView
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import com.google.firebase.messaging.FirebaseMessaging
import com.twilio.voice.RegistrationException
import com.twilio.voice.RegistrationListener
import com.twilio.voice.Voice
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

/**
 * Jim's home screen. Asks for mic + notification permissions, gets an FCM token and a
 * Twilio access token from the server, and registers the device so it can receive calls.
 */
class MainActivity : AppCompatActivity() {

    private val scope = CoroutineScope(Dispatchers.Main + SupervisorJob())
    private lateinit var statusView: TextView

    private val permissionLauncher =
        registerForActivityResult(ActivityResultContracts.RequestMultiplePermissions()) {
            register()
        }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        statusView = findViewById(R.id.statusView)
        statusView.setOnClickListener { register() } // tap to retry
        requestPermissions()
    }

    private fun requestPermissions() {
        val perms = mutableListOf(Manifest.permission.RECORD_AUDIO)
        if (Build.VERSION.SDK_INT >= 33) perms += Manifest.permission.POST_NOTIFICATIONS
        permissionLauncher.launch(perms.toTypedArray())
    }

    private fun register() {
        statusView.text = getString(R.string.status_connecting)
        FirebaseMessaging.getInstance().token.addOnCompleteListener { task ->
            if (!task.isSuccessful) {
                statusView.text = getString(R.string.status_error, "no push token")
                return@addOnCompleteListener
            }
            val fcmToken = task.result
            scope.launch {
                try {
                    val accessToken = withContext(Dispatchers.IO) { Api.fetchAccessToken() }
                    Voice.register(
                        accessToken,
                        Voice.RegistrationChannel.FCM,
                        fcmToken,
                        registrationListener
                    )
                } catch (e: Exception) {
                    statusView.text = getString(R.string.status_error, e.message ?: "unknown")
                }
            }
        }
    }

    private val registrationListener = object : RegistrationListener {
        override fun onRegistered(accessToken: String, fcmToken: String) {
            statusView.text = getString(R.string.status_protected)
        }

        override fun onError(error: RegistrationException, accessToken: String, fcmToken: String) {
            statusView.text = getString(R.string.status_error, error.message ?: "registration failed")
        }
    }
}
