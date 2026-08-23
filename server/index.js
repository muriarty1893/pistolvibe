import express from 'express'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')

const app = express()
const PORT = process.env.PORT || 3001
const DATA_DIR = path.join(__dirname, 'data')
const COMMENTS_FILE = path.join(DATA_DIR, 'comments.json')
const APPLICATIONS_FILE = path.join(DATA_DIR, 'applications.json')

app.use(express.json({ limit: '20kb' }))

async function readJson(file, fallback) {
  try {
    const raw = await fs.readFile(file, 'utf-8')
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

async function writeJson(file, data) {
  await fs.mkdir(path.dirname(file), { recursive: true })
  await fs.writeFile(file, JSON.stringify(data, null, 2))
}

const clean = (value, max = 500) =>
  String(value ?? '')
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, max)

// Basit hız sınırı: IP başına dakikada 10 POST isteği
const hits = new Map()
function rateLimit(req, res, next) {
  const now = Date.now()
  const windowMs = 60_000
  const list = (hits.get(req.ip) || []).filter((t) => now - t < windowMs)
  if (list.length >= 10) {
    return res
      .status(429)
      .json({ error: 'Çok fazla istek gönderdin. Lütfen biraz sonra tekrar dene.' })
  }
  list.push(now)
  hits.set(req.ip, list)
  next()
}

app.get('/api/comments', async (_req, res) => {
  const comments = await readJson(COMMENTS_FILE, [])
  res.json(comments)
})

app.post('/api/comments', rateLimit, async (req, res) => {
  const name = clean(req.body?.name, 40)
  const pistol = clean(req.body?.pistol, 60)
  const message = clean(req.body?.message, 500)

  if (!name || !pistol || !message) {
    return res.status(400).json({ error: 'Lütfen tüm alanları doldurun.' })
  }

  const comments = await readJson(COMMENTS_FILE, [])
  const comment = {
    id: Date.now().toString(36),
    name,
    pistol,
    message,
    createdAt: new Date().toISOString(),
  }
  comments.unshift(comment)
  await writeJson(COMMENTS_FILE, comments)
  res.status(201).json(comment)
})

app.post('/api/applications', rateLimit, async (req, res) => {
  const application = {
    id: Date.now().toString(36),
    name: clean(req.body?.name, 60),
    callsign: clean(req.body?.callsign, 40),
    age: Number(req.body?.age) || null,
    email: clean(req.body?.email, 80),
    phone: clean(req.body?.phone, 30),
    pistol: clean(req.body?.pistol, 80),
    experience: clean(req.body?.experience, 40),
    message: clean(req.body?.message, 1000),
    createdAt: new Date().toISOString(),
  }

  if (
    !application.name ||
    !application.callsign ||
    !application.age ||
    !application.email ||
    !application.experience
  ) {
    return res.status(400).json({ error: 'Lütfen zorunlu alanları doldurun.' })
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(application.email)) {
    return res.status(400).json({ error: 'Geçerli bir e-posta adresi girin.' })
  }

  const applications = await readJson(APPLICATIONS_FILE, [])
  applications.unshift(application)
  await writeJson(APPLICATIONS_FILE, applications)
  res.status(201).json({ ok: true })
})

// Not: Galeri görselleri artık build sırasında toplanıyor (src/assets/gallery),
// bu yüzden /api/gallery ucu kaldırıldı.

if (process.env.NODE_ENV === 'production') {
  const dist = path.join(ROOT, 'dist')
  app.use(express.static(dist))
  app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')))
}

app.listen(PORT, () => {
  console.log(`API sunucusu çalışıyor: http://localhost:${PORT}`)
})
