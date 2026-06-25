import { spawn } from 'node:child_process'
import { writeFile, readFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import { config } from './config.js'

const TMP = path.resolve('tmp')

// μ-law (G.711) decode lookup table → PCM16. Twilio Media Streams send μ-law.
const MULAW = (() => {
  const t = new Int16Array(256)
  for (let i = 0; i < 256; i++) {
    const u = ~i & 0xff
    let s = ((u & 0x0f) << 3) + 0x84
    s <<= (u & 0x70) >> 4
    t[i] = u & 0x80 ? 0x84 - s : s - 0x84
  }
  return t
})()

// Twilio media: μ-law, 8 kHz, mono. Whisper wants 16 kHz PCM16.
export async function transcribeMuLaw(muLawBuf, id) {
  const pcm8 = new Int16Array(muLawBuf.length)
  for (let i = 0; i < muLawBuf.length; i++) pcm8[i] = MULAW[muLawBuf[i]]
  return transcribePcm8(pcm8, id)
}

// PCM16 @ 8 kHz → naive 2x upsample → 16 kHz → Whisper.
export async function transcribePcm8(pcm8, id) {
  const up = new Int16Array(pcm8.length * 2)
  for (let i = 0; i < pcm8.length; i++) {
    const a = pcm8[i]
    const b = i + 1 < pcm8.length ? pcm8[i + 1] : a
    up[i * 2] = a
    up[i * 2 + 1] = (a + b) >> 1
  }
  return transcribePcm16k(up, id)
}

export async function transcribePcm16k(samples, id) {
  if (config.whisper.mode === 'http') return transcribeViaService(samples)
  await mkdir(TMP, { recursive: true })
  const wavPath = path.join(TMP, `${id}.wav`)
  await writeFile(wavPath, pcmToWav(samples, 16000))
  return runWhisper(wavPath)
}

// Warm Python sidecar (faster-whisper). Send raw PCM16 LE mono @ 16 kHz; it keeps
// the model loaded, so there's no per-window reload cost.
async function transcribeViaService(samples) {
  const body = Buffer.from(samples.buffer, samples.byteOffset, samples.byteLength)
  const resp = await fetch(`${config.whisper.serviceUrl}/transcribe`, {
    method: 'POST',
    headers: { 'content-type': 'application/octet-stream', 'x-sample-rate': '16000' },
    body,
  })
  if (!resp.ok) throw new Error(`whisper service ${resp.status}`)
  const j = await resp.json()
  return (j.text || '').trim()
}

function pcmToWav(samples, rate) {
  const dataSize = samples.length * 2
  const b = Buffer.alloc(44 + dataSize)
  b.write('RIFF', 0)
  b.writeUInt32LE(36 + dataSize, 4)
  b.write('WAVE', 8)
  b.write('fmt ', 12)
  b.writeUInt32LE(16, 16)
  b.writeUInt16LE(1, 20) // PCM
  b.writeUInt16LE(1, 22) // mono
  b.writeUInt32LE(rate, 24)
  b.writeUInt32LE(rate * 2, 28)
  b.writeUInt16LE(2, 32)
  b.writeUInt16LE(16, 34)
  b.write('data', 36)
  b.writeUInt32LE(dataSize, 40)
  for (let i = 0; i < samples.length; i++) b.writeInt16LE(samples[i], 44 + i * 2)
  return b
}

// Shell out to whisper.cpp. -nt = no timestamps, -otxt writes <of>.txt.
function runWhisper(wavPath) {
  return new Promise((resolve, reject) => {
    const of = wavPath.replace(/\.wav$/, '')
    const args = ['-m', config.whisper.model, '-f', wavPath, '-nt', '-otxt', '-of', of]
    const p = spawn(config.whisper.bin, args)
    let err = ''
    p.stderr.on('data', d => (err += d))
    p.on('error', reject)
    p.on('close', async code => {
      if (code !== 0) return reject(new Error(`whisper exited ${code}: ${err.slice(-200)}`))
      try {
        resolve((await readFile(`${of}.txt`, 'utf8')).trim())
      } catch (e) {
        reject(e)
      }
    })
  })
}

// Parse a 16-bit PCM WAV buffer (skip 44-byte header) into Int16Array @ source rate.
export function wavToPcm16(wav) {
  const pcm = new Int16Array((wav.length - 44) / 2)
  for (let i = 0; i < pcm.length; i++) pcm[i] = wav.readInt16LE(44 + i * 2)
  return pcm
}
