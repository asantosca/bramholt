# Keep Twilio Voice SDK classes (it uses native + reflection).
-keep class com.twilio.** { *; }
-keep class tvo.webrtc.** { *; }
-dontwarn com.twilio.**
-dontwarn tvo.webrtc.**
