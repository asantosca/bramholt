import twilio from 'twilio'
import { config } from './config.js'

const client = twilio(config.twilio.accountSid, config.twilio.authToken)

// Drop a live call we've judged a scam. Updating the call replaces its TwiML:
// the person on this leg hears the message, then the leg hangs up.
//
// Server-first test (no app): this leg is the caller (you), so you hear it — proof it works.
// With the app: this is the caller (scammer) leg; meanwhile Jim's app, polling /status,
// sees 'scam', disconnects its own leg, and shows/plays Jim the warning locally.
export async function dropCallAsScam(callSid) {
  const twiml =
    '<?xml version="1.0" encoding="UTF-8"?>' +
    '<Response>' +
    '<Say voice="Polly.Joanna">This is Bramholt. This call looks like a scam, so we are ending it now. You are safe.</Say>' +
    '<Hangup/>' +
    '</Response>'
  try {
    await client.calls(callSid).update({ twiml })
    console.log(`[drop] ended call ${callSid} as scam`)
  } catch (e) {
    console.error(`[drop] failed for ${callSid}:`, e.message)
  }
}
