import express from 'express'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')

const app = express()
const PORT = process.env.PORT || 3001
const DATA_DIR = path.join(__dirname, 'data')
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads')
const COMMENTS_FILE = path.join(DATA_DIR, 'comments.json')
const APPLICATIONS_FILE = path.join(DATA_DIR, 'applications.json')
const SCORES_FILE = path.join(DATA_DIR, 'scores.json')
const CONTENT_FILE = path.join(DATA_DIR, 'content.json')

app.use(express.json({ limit: '6mb' }))

// ── Varsayılan site içeriği (Vercel'deki api/_content.ts ile aynı) ──
const DEFAULT_CONTENT = {
  stats: [
    { id: 'stat-members', value: 25, suffix: '+', label: 'Aktif Üye' },
    { id: 'stat-matches', value: 40, suffix: '+', label: 'Oynanan Maç' },
    { id: 'stat-bullets', value: 12500, suffix: '+', label: 'Atılan Airsoft Mermisi' },
    { id: 'stat-founded', value: 2026, suffix: '', label: 'Kuruluş Yılı' },
  ],
  arsenal: [
    {
      id: 'arsenal-ssp5',
      name: 'NOVRITSCH SSP5 6" GBB',
      href: 'https://eu.novritsch.com/product/ssp5-gas-blowback-pistol/',
    },
    { id: 'arsenal-glock17', name: 'Glock 17 Gen 4', href: 'https://weairsoft.com/we-g001b-bk.html' },
  ],
  gallery: [],
  events: [],
}

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

// ── Refleks Arenası skor tablosu ──
app.get('/api/scores', async (_req, res) => {
  const scores = await readJson(SCORES_FILE, [])
  const top = scores.sort((a, b) => b.score - a.score).slice(0, 10)
  res.json(top)
})

app.post('/api/scores', rateLimit, async (req, res) => {
  const callsign = clean(req.body?.callsign, 20)
  const score = Math.floor(Number(req.body?.score))
  const accuracy = Math.min(100, Math.max(0, Math.floor(Number(req.body?.accuracy) || 0)))
  const bestStreak = Math.min(999, Math.max(0, Math.floor(Number(req.body?.bestStreak) || 0)))

  if (!callsign || callsign.length < 2) {
    return res.status(400).json({ error: 'Çağrı adı en az 2 karakter olmalı.' })
  }
  // Saçma skorları filtrele: 30 saniyede teorik maksimum ~4000
  if (!Number.isFinite(score) || score < 0 || score > 10000) {
    return res.status(400).json({ error: 'Geçersiz skor.' })
  }

  const scores = await readJson(SCORES_FILE, [])
  const entry = {
    id: Date.now().toString(36),
    callsign,
    score,
    accuracy,
    bestStreak,
    createdAt: new Date().toISOString(),
  }
  scores.push(entry)
  await writeJson(SCORES_FILE, scores)
  res.status(201).json(entry)
})

// Not: Galeri artık admin panelinden yönetilir (content.json + uploads/).

// ── Admin (yerel geliştirme; Vercel'de api/admin*.ts çalışır) ──
function adminAuth(req, res) {
  const password = process.env.ADMIN_PASSWORD
  if (!password) {
    res.status(500).json({ error: 'ADMIN_PASSWORD ortam değişkeni tanımlı değil.' })
    return false
  }
  if (req.headers['x-admin-key'] !== password) {
    res.status(401).json({ error: 'Yetkisiz erişim.' })
    return false
  }
  return true
}

function clampScoreFields(body = {}) {
  return {
    score: Math.max(0, Math.floor(Number(body.score)) || 0),
    accuracy: Math.min(100, Math.max(0, Math.floor(Number(body.accuracy) || 0))),
    bestStreak: Math.min(999, Math.max(0, Math.floor(Number(body.bestStreak) || 0))),
  }
}

async function removeItem(file, id) {
  const items = await readJson(file, [])
  const filtered = items.filter((it) => it.id !== id)
  if (filtered.length === items.length) return false
  await writeJson(file, filtered)
  return true
}

async function updateItem(file, id, transform) {
  const items = await readJson(file, [])
  const idx = items.findIndex((it) => it.id === id)
  if (idx === -1) return false
  items[idx] = transform(items[idx])
  await writeJson(file, items)
  return true
}

app.get('/api/content', async (_req, res) => {
  res.json(await readJson(CONTENT_FILE, DEFAULT_CONTENT))
})

// Yüklenen fotoğrafları sun
app.use('/uploads', express.static(UPLOADS_DIR))

app.get('/api/admin', async (req, res) => {
  if (!adminAuth(req, res)) return
  const [comments, applications, scores, content] = await Promise.all([
    readJson(COMMENTS_FILE, []),
    readJson(APPLICATIONS_FILE, []),
    readJson(SCORES_FILE, []),
    readJson(CONTENT_FILE, DEFAULT_CONTENT),
  ])
  scores.sort((a, b) => b.score - a.score)
  res.json({ comments, applications, scores, content })
})

app.post('/api/admin', async (req, res) => {
  if (!adminAuth(req, res)) return
  const action = String(req.body?.action || '')

  try {
    switch (action) {
      case 'comment-update': {
        const { id, name, pistol, message } = req.body ?? {}
        if (!id || !name?.trim() || !pistol?.trim() || !message?.trim()) {
          return res.status(400).json({ error: 'Tüm alanları doldurun.' })
        }
        const ok = await updateItem(COMMENTS_FILE, id, (oldC) => ({
          ...oldC,
          name: clean(name, 40),
          pistol: clean(pistol, 60),
          message: clean(message, 500),
        }))
        return ok ? res.json({ ok: true }) : res.status(404).json({ error: 'Yorum bulunamadı.' })
      }

      case 'comment-delete': {
        const ok = await removeItem(COMMENTS_FILE, String(req.body?.id || ''))
        return ok ? res.json({ ok: true }) : res.status(404).json({ error: 'Kayıt bulunamadı.' })
      }

      case 'application-delete': {
        const ok = await removeItem(APPLICATIONS_FILE, String(req.body?.id || ''))
        return ok ? res.json({ ok: true }) : res.status(404).json({ error: 'Kayıt bulunamadı.' })
      }

      case 'score-add': {
        const callsign = clean(req.body?.callsign, 20)
        if (!callsign || callsign.length < 2) {
          return res.status(400).json({ error: 'Çağrı adı en az 2 karakter olmalı.' })
        }
        const fields = clampScoreFields(req.body)
        if (fields.score > 10000) return res.status(400).json({ error: 'Geçersiz skor.' })
        const entry = {
          id: Date.now().toString(36),
          callsign,
          ...fields,
          createdAt: new Date().toISOString(),
        }
        const scores = await readJson(SCORES_FILE, [])
        scores.push(entry)
        await writeJson(SCORES_FILE, scores)
        return res.status(201).json(entry)
      }

      case 'score-update': {
        const callsign = clean(req.body?.callsign, 20)
        if (!req.body?.id || !callsign || callsign.length < 2) {
          return res.status(400).json({ error: 'Çağrı adı en az 2 karakter olmalı.' })
        }
        const fields = clampScoreFields(req.body)
        if (fields.score > 10000) return res.status(400).json({ error: 'Geçersiz skor.' })
        const ok = await updateItem(SCORES_FILE, String(req.body.id), (oldS) => ({
          ...oldS,
          callsign,
          ...fields,
        }))
        return ok ? res.json({ ok: true }) : res.status(404).json({ error: 'Skor bulunamadı.' })
      }

      case 'score-delete': {
        const ok = await removeItem(SCORES_FILE, String(req.body?.id || ''))
        return ok ? res.json({ ok: true }) : res.status(404).json({ error: 'Skor bulunamadı.' })
      }

      default:
        return res.status(400).json({ error: 'Geçersiz istek.' })
    }
  } catch (err) {
    console.error('admin hatası:', err)
    res.status(500).json({ error: 'Sunucu hatası.' })
  }
})

// Yerel "Blob" yerine disk; base64 JSON gövdesi beklenir.
const MAX_UPLOAD_BYTES_LOCAL = 3.5 * 1024 * 1024
const ALLOWED_TYPES_LOCAL = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif'])
const EXT_BY_TYPE = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/avif': '.avif',
}

app.put('/api/admin-content', async (req, res) => {
  if (!adminAuth(req, res)) return
  const body = typeof req.body === 'object' && req.body !== null ? req.body : {}
  const current = await readJson(CONTENT_FILE, DEFAULT_CONTENT)
  const next = {
    stats: Array.isArray(body.stats) && body.stats.length > 0 ? body.stats : current.stats,
    arsenal:
      Array.isArray(body.arsenal) && body.arsenal.length > 0 ? body.arsenal : current.arsenal,
    gallery: Array.isArray(body.gallery) ? body.gallery : current.gallery,
    events: Array.isArray(body.events) ? body.events : current.events,
    updatedAt: new Date().toISOString(),
  }
  await writeJson(CONTENT_FILE, next)
  res.json({ ok: true })
})

app.post('/api/admin-content', async (req, res) => {
  if (!adminAuth(req, res)) return
  const action = String(req.body?.action || '')

  if (action === 'upload') {
    const contentType = String(req.body?.contentType || '')
    const ext = EXT_BY_TYPE[contentType]
    if (!ext || !ALLOWED_TYPES_LOCAL.has(contentType)) {
      return res.status(400).json({ error: 'Sadece PNG/JPG/WEBP/GIF/AVIF yükleyebilirsin.' })
    }
    const buffer = Buffer.from(String(req.body?.data || ''), 'base64')
    if (buffer.length === 0) return res.status(400).json({ error: 'Dosya verisi boş.' })
    if (buffer.length > MAX_UPLOAD_BYTES_LOCAL) {
      return res.status(413).json({ error: 'Fotoğraf çok büyük (maks 3.5MB).' })
    }
    await fs.mkdir(UPLOADS_DIR, { recursive: true })
    const filename = `${Date.now().toString(36)}${ext}`
    await fs.writeFile(path.join(UPLOADS_DIR, filename), buffer)
    return res.status(201).json({
      ok: true,
      item: {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        url: `/uploads/${filename}`,
        caption: '',
      },
    })
  }

  if (action === 'blob-delete') {
    const url = String(req.body?.url || '')
    // Sadece kendi uploads klasörümüzdeki dosyaları silebiliriz
    const match = url.match(/^\/uploads\/([A-Za-z0-9._-]+)$/)
    if (!match) return res.status(400).json({ error: 'Geçersiz dosya adresi.' })
    try {
      await fs.unlink(path.join(UPLOADS_DIR, match[1]))
    } catch {
      // zaten silinmiş olabilir — yut
    }
    return res.json({ ok: true })
  }

  res.status(400).json({ error: 'Geçersiz istek.' })
})

if (process.env.NODE_ENV === 'production') {
  const dist = path.join(ROOT, 'dist')
  app.use(express.static(dist))
  app.get('/admin', (_req, res) => res.sendFile(path.join(dist, 'admin.html')))
  app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')))
}

app.listen(PORT, () => {
  console.log(`API sunucusu çalışıyor: http://localhost:${PORT}`)
})
