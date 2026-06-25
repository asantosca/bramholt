// In-memory call state. MVP only — restart = gone. One entry per Twilio CallSid.
// status: 'screening' | 'scam' | 'clear'
const calls = new Map()

export const store = {
  start(sid) {
    if (!calls.has(sid)) {
      calls.set(sid, { status: 'screening', transcript: '', verdict: null, startedAt: Date.now() })
    }
    return calls.get(sid)
  },
  get(sid) {
    return calls.get(sid)
  },
  setTranscript(sid, text) {
    const c = this.start(sid)
    c.transcript = text
  },
  setVerdict(sid, verdict) {
    const c = this.start(sid)
    c.verdict = verdict
  },
  setStatus(sid, status) {
    const c = this.start(sid)
    c.status = status
  },
}
