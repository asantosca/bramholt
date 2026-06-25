import { store } from './store.js'
import { transcribeMuLaw } from './transcribe.js'
import { judgeScam } from './scam.js'
import { dropCallAsScam } from './twilio-actions.js'
import { config } from './config.js'

// One Twilio Media Stream WebSocket = one call. We buffer the caller's μ-law
// audio, and every ~judgeIntervalMs we transcribe the call-so-far and re-judge.
// ~8000 bytes of μ-law ≈ 1 second of 8 kHz mono.
const BYTES_PER_SECOND = 8000

export function handleMediaStream(ws) {
  let callSid = null
  let chunks = [] // Buffer[] of μ-law, whole call so far
  let bytesSinceJudge = 0
  let judging = false

  ws.on('message', async raw => {
    let msg
    try {
      msg = JSON.parse(raw.toString())
    } catch {
      return
    }

    switch (msg.event) {
      case 'start':
        callSid = msg.start.callSid
        store.start(callSid)
        console.log(`[media] start ${callSid}`)
        break

      case 'media': {
        const payload = Buffer.from(msg.media.payload, 'base64')
        chunks.push(payload)
        bytesSinceJudge += payload.length

        const ready = bytesSinceJudge >= (config.judgeIntervalMs / 1000) * BYTES_PER_SECOND
        if (!ready || judging) break

        judging = true
        bytesSinceJudge = 0
        const audio = Buffer.concat(chunks) // re-transcribe whole call for full context
        const sid = callSid
        try {
          const transcript = await transcribeMuLaw(audio, sid)
          if (transcript) {
            store.setTranscript(sid, transcript)
            const verdict = await judgeScam(transcript)
            store.setVerdict(sid, verdict)
            console.log(
              `[judge] ${sid} scam=${verdict.scam} conf=${verdict.confidence} ${verdict.category} — ${verdict.reason}`
            )
            if (verdict.scam && verdict.confidence >= config.scamThreshold) {
              store.setStatus(sid, 'scam')
              await dropCallAsScam(sid) // ends the caller leg; app (polling /status) drops Jim's leg
            }
          }
        } catch (e) {
          console.error(`[judge] error ${sid}:`, e.message)
        } finally {
          judging = false
        }
        break
      }

      case 'stop':
        console.log(`[media] stop ${callSid}`)
        break
    }
  })

  ws.on('close', () => console.log(`[media] ws closed ${callSid}`))
  ws.on('error', e => console.error('[media] ws error:', e.message))
}
