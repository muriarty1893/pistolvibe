import type { VercelRequest, VercelResponse } from '@vercel/node'
import { withRedis } from './redis-client.js'
import { checkAdminAuth } from './admin-auth.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const auth = checkAdminAuth(req)
  if (!auth.ok) {
    return res.status(auth.status ?? 500).json({ error: auth.error })
  }
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Bu yöntem desteklenmiyor.' })
  }

  try {
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
  } catch (err) {
    console.error('admin-data hatası:', err)
    return res.status(500).json({ error: 'Sunucu hatası. Lütfen daha sonra tekrar dene.' })
  }
}
