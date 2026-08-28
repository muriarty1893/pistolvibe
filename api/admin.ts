import type { VercelRequest, VercelResponse } from '@vercel/node'
import { withRedis } from './redis-client.js'
import { CONTENT_KEY, parseStoredContent } from './_content.js'
import { checkAdminAuth } from './_admin-auth.js'
import type { Comment } from './comments.js'
import type { ScoreRow } from './scores.js'

// GET  /api/admin   → tüm veriler: başvurular + yorumlar + skorlar + site içeriği
// POST /api/admin   → aksiyon tabanlı düzenleme API'si:
//   { action: 'comment-update', id, name, pistol, message }
//   { action: 'comment-delete', id }
//   { action: 'application-delete', id }
//   { action: 'score-add', callsign, score, accuracy, bestStreak }
//   { action: 'score-update', id, callsign, score, accuracy, bestStreak }
//   { action: 'score-delete', id }

const clean = (value: unknown, max = 500): string =>
  String(value ?? '')
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, max)

function clampScoreFields(body: Record<string, unknown>) {
  return {
    score: Math.max(0, Math.floor(Number(body?.score)) || 0),
    accuracy: Math.min(100, Math.max(0, Math.floor(Number(body?.accuracy) || 0))),
    bestStreak: Math.min(999, Math.max(0, Math.floor(Number(body?.bestStreak) || 0))),
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const auth = checkAdminAuth(req)
  if (!auth.ok) {
    return res.status(auth.status ?? 500).json({ error: auth.error })
  }

  try {
    if (req.method === 'GET') {
      const data = await withRedis(async (client) => {
        const [commentsRaw, applicationsRaw, scoresRaw, contentRaw] = await Promise.all([
          client.lRange('comments', 0, -1),
          client.lRange('applications', 0, -1),
          client.lRange('scores', 0, -1),
          client.get(CONTENT_KEY),
        ])
        const parseAll = <T>(arr: string[]) =>
          arr
            .map((item) => {
              try {
                return JSON.parse(item) as T
              } catch {
                return null
              }
            })
            .filter((item): item is T => item !== null)
        return {
          comments: parseAll<Comment>(commentsRaw),
          applications: parseAll<Record<string, unknown>>(applicationsRaw),
          scores: parseAll<ScoreRow>(scoresRaw).sort((a, b) => b.score - a.score),
          content: parseStoredContent(contentRaw),
        }
      })
      return res.status(200).json(data)
    }

    if (req.method === 'POST') {
      const action = String(req.body?.action || '')

      switch (action) {
        // ── Yorum düzenle ──
        case 'comment-update': {
          const id = String(req.body?.id || '')
          const name = clean(req.body?.name, 40)
          const pistol = clean(req.body?.pistol, 60)
          const message = clean(req.body?.message, 500)
          if (!id || !name || !pistol || !message) {
            return res.status(400).json({ error: 'Tüm alanları doldurun.' })
          }
          const updated = await updateListItem<Comment>('comments', id, (old) => ({
            ...old,
            name,
            pistol,
            message,
          }))
          return updated
            ? res.status(200).json({ ok: true })
            : res.status(404).json({ error: 'Yorum bulunamadı.' })
        }

        // ── Yorum sil ──
        case 'comment-delete': {
          const id = String(req.body?.id || '')
          if (!id) return res.status(400).json({ error: 'Geçersiz istek.' })
          const removed = await removeListItem('comments', id)
          return removed
            ? res.status(200).json({ ok: true })
            : res.status(404).json({ error: 'Kayıt bulunamadı.' })
        }

        // ── Başvuru sil ──
        case 'application-delete': {
          const id = String(req.body?.id || '')
          if (!id) return res.status(400).json({ error: 'Geçersiz istek.' })
          const removed = await removeListItem('applications', id)
          return removed
            ? res.status(200).json({ ok: true })
            : res.status(404).json({ error: 'Kayıt bulunamadı.' })
        }

        // ── Skor ekle (manuel/admin) ──
        case 'score-add': {
          const callsign = clean(req.body?.callsign, 20)
          if (!callsign || callsign.length < 2) {
            return res.status(400).json({ error: 'Çağrı adı en az 2 karakter olmalı.' })
          }
          const fields = clampScoreFields(req.body ?? {})
          if (fields.score > 10000) {
            return res.status(400).json({ error: 'Geçersiz skor.' })
          }
          const entry: ScoreRow = {
            id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
            callsign,
            ...fields,
            createdAt: new Date().toISOString(),
          }
          await withRedis(async (client) => {
            await client.lPush('scores', JSON.stringify(entry))
            await client.expire('scores', 60 * 60 * 24 * 180)
          })
          return res.status(201).json(entry)
        }

        // ── Skor güncelle ──
        case 'score-update': {
          const id = String(req.body?.id || '')
          const callsign = clean(req.body?.callsign, 20)
          if (!id || !callsign || callsign.length < 2) {
            return res.status(400).json({ error: 'Çağrı adı en az 2 karakter olmalı.' })
          }
          const fields = clampScoreFields(req.body ?? {})
          if (fields.score > 10000) {
            return res.status(400).json({ error: 'Geçersiz skor.' })
          }
          const updated = await updateListItem<ScoreRow>('scores', id, (old) => ({
            ...old,
            callsign,
            ...fields,
          }))
          return updated
            ? res.status(200).json({ ok: true })
            : res.status(404).json({ error: 'Skor bulunamadı.' })
        }

        // ── Skor sil ──
        case 'score-delete': {
          const id = String(req.body?.id || '')
          if (!id) return res.status(400).json({ error: 'Geçersiz istek.' })
          const removed = await removeListItem('scores', id)
          return removed
            ? res.status(200).json({ ok: true })
            : res.status(404).json({ error: 'Skor bulunamadı.' })
        }

        default:
          return res.status(400).json({ error: 'Geçersiz istek.' })
      }
    }

    res.setHeader('Allow', 'GET, POST')
    return res.status(405).json({ error: 'Bu yöntem desteklenmiyor.' })
  } catch (err) {
    console.error('admin hatası:', err)
    return res.status(500).json({ error: 'Sunucu hatası. Lütfen daha sonra tekrar dene.' })
  }
}

// ── Redis list yardımcıları ─────────────────────────────────────────────

async function removeListItem(key: string, id: string): Promise<boolean> {
  return withRedis(async (client) => {
    const items = await client.lRange(key, 0, -1)
    let found = false
    for (const item of items) {
      try {
        const obj = JSON.parse(item)
        if (obj?.id === id) {
          await client.lRem(key, 0, item)
          found = true
        }
      } catch {
        // bozuk kayıt — atla
      }
    }
    return found
  })
}

async function updateListItem<T extends { id: string }>(
  key: string,
  id: string,
  transform: (old: T) => T
): Promise<boolean> {
  return withRedis(async (client) => {
    const items = await client.lRange(key, 0, -1)
    for (const item of items) {
      try {
        const obj = JSON.parse(item) as T
        if (obj?.id !== id) continue
        const next = transform(obj)
        await client.lRem(key, 0, item)
        await client.lPush(key, JSON.stringify(next))
        return true
      } catch {
        continue
      }
    }
    return false
  })
}
