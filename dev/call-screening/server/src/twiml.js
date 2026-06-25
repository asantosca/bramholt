import twilio from 'twilio'
import { config, wsBase } from './config.js'
import { store } from './store.js'
import { judgeScam } from './scam.js'
import { transcribePcm8, wavToPcm16 } from './transcribe.js'

const AccessToken = twilio.jwt.AccessToken
const VoiceGrant = AccessToken.VoiceGrant

export function registerTwimlRoutes(app) {
  // --- SERVER-FIRST TEST ----------------------------------------------------
  // Point your Twilio number's "A call comes in" webhook here while there's no
  // app yet. It answers, forks audio to Whisper, and lets you talk (play a
  // scammer) so you can watch detection + auto-drop work from any phone.
  app.post('/voice/test', (_req, res) => {
    const tw = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Start><Stream url="${wsBase()}/media" track="inbound_track"/></Start>
  <Say voice="Polly.Joanna">Bramholt screening is listening. Go ahead.</Say>
  <Pause length="120"/>
</Response>`
    res.type('text/xml').send(tw)
  })

  // --- REAL INCOMING (app phase) -------------------------------------------
  // Fork audio for screening, then ring Jim's app (Voice SDK client "jim").
  app.post('/voice/incoming', (_req, res) => {
    const tw = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Start><Stream url="${wsBase()}/media" track="inbound_track"/></Start>
  <Dial timeout="20" answerOnBridge="true" action="${config.publicUrl}/voice/after-dial">
    <Client>jim</Client>
  </Dial>
</Response>`
    res.type('text/xml').send(tw)
  })

  // After <Dial>: Jim answered → done; otherwise → voicemail.
  app.post('/voice/after-dial', (req, res) => {
    if (req.body.DialCallStatus === 'completed') {
      res.type('text/xml').send('<Response><Hangup/></Response>')
      return
    }
    const tw = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">Jim can't take the call right now. Please leave a message after the tone.</Say>
  <Record maxLength="60" playBeep="true"
          action="${config.publicUrl}/voice/voicemail-done"
          recordingStatusCallback="${config.publicUrl}/voice/voicemail-recording"/>
  <Hangup/>
</Response>`
    res.type('text/xml').send(tw)
  })

  app.post('/voice/voicemail-done', (_req, res) => {
    res
      .type('text/xml')
      .send('<Response><Say voice="Polly.Joanna">Thank you. Goodbye.</Say><Hangup/></Response>')
  })

  // Recording ready → ack immediately, then transcribe + judge in the background.
  app.post('/voice/voicemail-recording', (req, res) => {
    res.sendStatus(200)
    handleVoicemailRecording(req.body).catch(e => console.error('[voicemail]', e.message))
  })

  // --- ACCESS TOKEN for the Android Voice SDK (app phase) -------------------
  app.get('/token', (req, res) => {
    const identity = String(req.query.identity || 'jim')
    const token = new AccessToken(
      config.twilio.accountSid,
      config.twilio.apiKeySid,
      config.twilio.apiKeySecret,
      { identity }
    )
    token.addGrant(
      new VoiceGrant({
        outgoingApplicationSid: config.twilio.twimlAppSid,
        pushCredentialSid: config.twilio.pushCredentialSid, // routes incoming calls to the app via FCM
        incomingAllow: true,
      })
    )
    res.json({ identity, token: token.toJwt() })
  })
}

async function handleVoicemailRecording({ RecordingUrl, CallSid }) {
  if (!RecordingUrl) return
  const auth = Buffer.from(`${config.twilio.accountSid}:${config.twilio.authToken}`).toString('base64')
  const resp = await fetch(`${RecordingUrl}.wav`, { headers: { Authorization: `Basic ${auth}` } })
  const wav = Buffer.from(await resp.arrayBuffer())
  const pcm8 = wavToPcm16(wav) // Twilio voicemail wav is PCM16 mono @ 8 kHz
  const transcript = await transcribePcm8(pcm8, `vm-${CallSid}`)
  const verdict = await judgeScam(transcript)

  store.start(CallSid)
  store.setTranscript(CallSid, transcript)
  store.setVerdict(CallSid, verdict)
  store.setStatus(CallSid, verdict.scam ? 'scam' : 'clear')

  console.log(`[voicemail] ${CallSid} → ${verdict.scam ? 'SCAM' : 'ok'} (${verdict.confidence}) — ${verdict.reason}`)
  console.log(`[voicemail] transcript: ${transcript}`)
}
