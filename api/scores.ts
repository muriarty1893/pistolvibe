import type { VercelRequest, VercelResponse } from '@vercel/node'
import { clean, getClientIp, isRateLimited, withRedis } from './redis-client.js'

export interface ScoreRow {
  id: string
  callsign: string
  score: number
  accuracy: number
  bestStreak: number
  createdAt: string
}

const MAX_SCORE = 10000

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      const raw = await withRedis(async (client) => client.lRange('scores', 0, -1))
      const scores = raw
        .map((item) => {
          try {
            return JSON.parse(item) as ScoreRow
          } catch {
            return null
          }
        })
        .filter((s): s is ScoreRow => s !== null)
        .sort((a, b) => b.score - a.score)
        .slice(0, 10)
      return res.status(200).json(scores)
    }

    if (req.method === 'POST') {
      const ip = getClientIp(req)
      const limited = await withRedis((client) => isRateLimited(client, ip, 'scores'))
      if (limited) {
        return res
          .status(429)
          .json({ error: 'Çok fazla istek gönderdin. Lütfen biraz sonra tekrar dene.' })
      }

      const callsign = clean(req.body?.callsign, 20)
      const score = Math.floor(Number(req.body?.score))
      const accuracy = Math.min(100, Math.max(0, Math.floor(Number(req.body?.accuracy) || 0)))
      const bestStreak = Math.min(999, Math.max(0, Math.floor(Number(req.body?.bestStreak) || 0)))

      if (!callsign || callsign.length < 2) {
        return res.status(400).json({ error: 'Çağrı adı en az 2 karakter olmalı.' })
      }
      if (!Number.isFinite(score) || score < 0 || score > MAX_SCORE) {
        return res.status(400).json({ error: 'Geçersiz skor.' })
      }

      const entry: ScoreRow = {
        id: Date.now().toString(36),
        callsign,
        score,
        accuracy,
        bestStreak,
        createdAt: new Date().toISOString(),
      }
      await withRedis(async (client) => {
        await client.lPush('scores', JSON.stringify(entry))
        await client.expire('scores', 60 * 60 * 24 * 180)
      })
      return res.status(201).json(entry)
    }

    res.setHeader('Allow', 'GET, POST')
    return res.status(405).json({ error: 'Bu yöntem desteklenmiyor.' })
  } catch (err) {
    console.error('scores hatası:', err)
    return res.status(500).json({ error: 'Sunucu hatası. Lütfen daha sonra tekrar dene.' })
  }
}
