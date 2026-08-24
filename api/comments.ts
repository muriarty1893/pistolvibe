import type { VercelRequest, VercelResponse } from '@vercel/node'
import { clean, getClientIp, isRateLimited, withRedis } from './redis-client'

export interface Comment {
  id: string
  name: string
  pistol: string
  message: string
  createdAt: string
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      const comments = await withRedis(async (client) => {
        const raw = await client.lRange('comments', 0, -1)
        return raw
          .map((item) => {
            try {
              return JSON.parse(item) as Comment
            } catch {
              return null
            }
          })
          .filter((c): c is Comment => c !== null)
      })
      return res.status(200).json(comments ?? [])
    }

    if (req.method === 'POST') {
      const ip = getClientIp(req)
      const limited = await withRedis((client) => isRateLimited(client, ip, 'comments'))
      if (limited) {
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
      await withRedis((client) => client.lPush('comments', JSON.stringify(comment)))
      return res.status(201).json(comment)
    }

    res.setHeader('Allow', 'GET, POST')
    return res.status(405).json({ error: 'Bu yöntem desteklenmiyor.' })
  } catch (err) {
    console.error('comments hatası:', err)
    return res.status(500).json({ error: 'Sunucu hatası. Lütfen daha sonra tekrar dene.' })
  }
}
