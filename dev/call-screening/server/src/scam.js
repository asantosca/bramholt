import Anthropic from '@anthropic-ai/sdk'
import { config } from './config.js'

const client = new Anthropic({ apiKey: config.anthropic.apiKey })

const SYSTEM = `You protect an elderly person ("Jim") from phone scams by judging a live, partial call transcript.

You are listening to the caller's side of an ongoing phone call. The transcript is rough (auto-generated) and incomplete — the call is still in progress.

Flag SCAMS, which include: impersonating a bank, government, tax authority, police, or a grandchild in trouble; demanding gift cards, wire transfers, crypto, or banking/OTP codes; manufacturing urgency or secrecy; "your account is compromised, act now"; tech-support pretexts; prize/lottery fees.

Do NOT flag ordinary calls: real family, appointment reminders, a genuine bank asking the person to call back on the number on their card, normal conversation.

Be cautious early: with little transcript, keep confidence low unless the scam markers are unmistakable. It is worse to wrongly drop a real call than to wait one more window.

Respond with ONLY a JSON object, no prose:
{"scam": boolean, "confidence": number between 0 and 1, "category": short string, "reason": one short sentence}`

export async function judgeScam(transcript) {
  if (!transcript || transcript.trim().length < 8) {
    return { scam: false, confidence: 0, category: 'none', reason: 'too little audio yet' }
  }
  const res = await client.messages.create({
    model: config.anthropic.model,
    max_tokens: 200,
    system: SYSTEM,
    messages: [
      { role: 'user', content: `Caller transcript so far:\n"""\n${transcript}\n"""\n\nIs this a scam?` },
    ],
  })
  const text = res.content.map(b => (b.type === 'text' ? b.text : '')).join('')
  const m = text.match(/\{[\s\S]*\}/)
  if (!m) return { scam: false, confidence: 0, category: 'parse-error', reason: 'no JSON in reply' }
  try {
    const v = JSON.parse(m[0])
    return {
      scam: !!v.scam,
      confidence: Number(v.confidence) || 0,
      category: v.category || 'unknown',
      reason: v.reason || '',
    }
  } catch {
    return { scam: false, confidence: 0, category: 'parse-error', reason: 'bad JSON' }
  }
}
