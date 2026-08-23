import type { VercelRequest, VercelResponse } from '@vercel/node'
import { kv } from '@vercel/kv'

export interface Comment {
  id: string
  name: string
  pistol: string
  message: string
  createdAt: string
}

const clean = (value: unknown, max = 500): string =>
  String(value ?? '')
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, max)

// KV tabanlı hız sınırı: IP başına dakikada 10 istek
async function isRateLimited(ip: string, bucket: string): Promise<boolean> {
  const key = `rl:${bucket}:${ip}`
  const count = await kv.incr(key)
  if (count === 1) await kv.expire(key, 60)
  return count > 10
}

export function getClientIp(req: VercelRequest): string {
  const forwarded = req.headers['x-forwarded-for']
  const raw = Array.isArray(forwarded) ? forwarded[0] : forwarded
  return raw?.split(',')[0].trim() || req.socket?.remoteAddress || 'unknown'
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      const comments = await kv.lrange<Comment>('comments', 0, -1)
      return res.status(200).json(comments ?? [])
    }

    if (req.method === 'POST') {
      if (await isRateLimited(getClientIp(req), 'comments')) {
        return res
          .status(429)
          .json({ error: 'Çok fazla istek gönderdin. Lütfen biraz sonra tekrar dene.' })
      }

      const name = clean(req.body?.name, 40)
      const pistol = clean(req.body?.pistol, 60)
      const message = clean(req.body?.message, 500)

      if (!name || !pistol || !message) {
        return res.status(400).json({ error: 'Lütfen tüm alanları doldurun.' })
      }

      const comment: Comment = {
        id: Date.now().toString(36),
        name,
        pistol,
        message,
        createdAt: new Date().toISOString(),
      }
      await kv.lpush('comments', comment)
      return res.status(201).json(comment)
    }

    res.setHeader('Allow', 'GET, POST')
    return res.status(405).json({ error: 'Bu yöntem desteklenmiyor.' })
  } catch (err) {
    console.error('comments hatası:', err)
    return res.status(500).json({ error: 'Sunucu hatası. Lütfen daha sonra tekrar dene.' })
  }
}
