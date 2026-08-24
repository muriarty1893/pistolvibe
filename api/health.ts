import type { VercelRequest, VercelResponse } from '@vercel/node'

export default function handler(_req: VercelRequest, res: VercelResponse) {
  const url = process.env.REDIS_URL
  res.status(200).json({
    ok: true,
    redisUrlSet: !!url,
    redisHost: url ? url.split('@')[1]?.split(':')[0] : null,
    nodeVersion: process.version,
  })
}
