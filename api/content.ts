import type { VercelRequest, VercelResponse } from '@vercel/node'
import { CONTENT_KEY, parseStoredContent, withRedis } from './redis-client.js'

// GET /api/content → { stats, arsenal, gallery }
// Public: frontend StatsStrip / Arsenal / Gallery bunu kullanır.
// Redis boşsa varsayılanlar döner.

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Bu yöntem desteklenmiyor.' })
  }

  try {
    const raw = await withRedis((client) => client.get(CONTENT_KEY))
    return res.status(200).json(parseStoredContent(raw))
  } catch (err) {
    console.error('content hatası:', err)
    // API kapalıysa da site çalışmaya devam etsin
    const fallback = await import('./_content.js').then((m) => m.DEFAULT_CONTENT)
    return res.status(200).json(fallback)
  }
}
