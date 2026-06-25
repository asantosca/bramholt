package com.bramholt.guardian

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Intent
import androidx.core.app.NotificationCompat
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import com.twilio.voice.CallException
import com.twilio.voice.CallInvite
import com.twilio.voice.CancelledCallInvite
import com.twilio.voice.MessageListener
import com.twilio.voice.Voice

/**
 * Receives the FCM push Twilio sends when a call comes in, and hands the data to the
 * Voice SDK. On a valid invite it raises a full-screen "incoming call" notification that
 * opens CallActivity (works even when the phone is locked).
 */
class IncomingCallService : FirebaseMessagingService(), MessageListener {

    override fun onNewToken(token: String) {
        // The next MainActivity launch re-registers with the fresh FCM token.
    }

    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        val data = remoteMessage.data
        if (data.isNotEmpty()) {
            Voice.handleMessage(this, data, this)
        }
    }

    override fun onCallInvite(callInvite: CallInvite) {
        CallManager.setIncoming(this, callInvite)
        notifyIncoming(callInvite)
    }

    override fun onCancelledCallInvite(cancelled: CancelledCallInvite, e: CallException?) {
        CallManager.listener?.onState("ended")
        getSystemService(NotificationManager::class.java).cancel(INCOMING_ID)
    }

    private fun notifyIncoming(ci: CallInvite) {
        val nm = getSystemService(NotificationManager::class.java)
        nm.createNotificationChannel(
            NotificationChannel(CHANNEL_ID, "Incoming calls", NotificationManager.IMPORTANCE_HIGH)
        )

        val openCall = Intent(this, CallActivity::class.java)
            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
        val pi = PendingIntent.getActivity(
            this, 0, openCall,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_bramholt)
            .setContentTitle("Bramholt — incoming call")
            .setContentText(ci.from ?: "Unknown caller")
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_CALL)
            .setFullScreenIntent(pi, true)
            .setAutoCancel(true)
            .build()

        nm.notify(INCOMING_ID, notification)
    }

    companion object {
        private const val CHANNEL_ID = "bramholt_incoming"
        const val INCOMING_ID = 42
    }
}
