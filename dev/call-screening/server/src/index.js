import 'dotenv/config'
import http from 'node:http'
import express from 'express'
import { WebSocketServer } from 'ws'
import { config } from './config.js'
import { registerTwimlRoutes } from './twiml.js'
import { handleMediaStream } from './media.js'
import { store } from './store.js'

const app = express()
app.use(express.urlencoded({ extended: false })) // Twilio webhooks post form-encoded
app.use(express.json())

registerTwimlRoutes(app)

// Polled by Jim's app: "is this call a scam yet?"
app.get('/status/:callSid', (req, res) => {
  const call = store.get(req.params.callSid)
  res.json({
    callSid: req.params.callSid,
    status: call?.status ?? 'unknown',
    verdict: call?.verdict ?? null,
  })
})

app.get('/health', (_req, res) => res.json({ ok: true }))

const server = http.createServer(app)

// Twilio Media Streams connect here (wss://…/media).
const wss = new WebSocketServer({ noServer: true })
server.on('upgrade', (req, socket, head) => {
  if (req.url === '/media') {
    wss.handleUpgrade(req, socket, head, ws => handleMediaStream(ws))
  } else {
    socket.destroy()
  }
})

server.listen(config.port, () => {
  console.log(`Bramholt call-screening server listening on :${config.port}`)
  console.log(`Public URL: ${config.publicUrl || '(PUBLIC_URL not set — run ngrok and set it)'}`)
  console.log(`Model: ${config.anthropic.model} | Whisper: ${config.whisper.bin}`)
})
