import type { VercelRequest, VercelResponse } from '@vercel/node'
import { withRedis } from './redis-client.js'
import { checkAdminAuth } from './_admin-auth.js'

// GET  /api/admin  → tüm başvurular + yorumlar
// POST /api/admin  → kayıt sil ({ type: 'comment' | 'application', id })

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const auth = checkAdminAuth(req)
  if (!auth.ok) {
    return res.status(auth.status ?? 500).json({ error: auth.error })
  }

  try {
    if (req.method === 'GET') {
      const data = await withRedis(async (client) => {
        const [commentsRaw, applicationsRaw] = await Promise.all([
          client.lRange('comments', 0, -1),
          client.lRange('applications', 0, -1),
        ])
        const parse = (arr: string[]) =>
          arr
            .map((item) => {
              try {
                return JSON.parse(item)
              } catch {
                return null
              }
            })
            .filter((item) => item !== null)
        return { comments: parse(commentsRaw), applications: parse(applicationsRaw) }
      })
      return res.status(200).json(data)
    }

    if (req.method === 'POST') {
      const type = req.body?.type
      const id = String(req.body?.id || '')
      if ((type !== 'comment' && type !== 'application') || !id) {
        return res.status(400).json({ error: 'Geçersiz istek.' })
      }

      const key = type === 'comment' ? 'comments' : 'applications'
      const removed = await withRedis(async (client) => {
        const items = await client.lRange(key, 0, -1)
        let count = 0
        for (const item of items) {
          try {
            const obj = JSON.parse(item)
            if (obj?.id === id) {
              count += await client.lRem(key, 0, item)
            }
          } catch {
            // bozuk kayıt — atla
          }
        }
        return count
      })

      if (removed === 0) {
        return res.status(404).json({ error: 'Kayıt bulunamadı.' })
      }
      return res.status(200).json({ ok: true, removed })
    }

    res.setHeader('Allow', 'GET, POST')
    return res.status(405).json({ error: 'Bu yöntem desteklenmiyor.' })
  } catch (err) {
    console.error('admin hatası:', err)
    return res.status(500).json({ error: 'Sunucu hatası. Lütfen daha sonra tekrar dene.' })
  }
}
