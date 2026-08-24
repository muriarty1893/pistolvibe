import type { VercelRequest, VercelResponse } from '@vercel/node'
import { clean, getClientIp, isRateLimited, withRedis } from './_redis'

interface Application {
  id: string
  name: string
  callsign: string
  age: number | null
  email: string
  phone: string
  pistol: string
  experience: string
  message: string
  createdAt: string
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Bu yöntem desteklenmiyor.' })
  }

  try {
    const ip = getClientIp(req)
    const limited = await withRedis((client) => isRateLimited(client, ip, 'applications'))
    if (limited) {
      return res
        .status(429)
        .json({ error: 'Çok fazla istek gönderdin. Lütfen biraz sonra tekrar dene.' })
    }

    const application: Application = {
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

    await withRedis((client) => client.lPush('applications', JSON.stringify(application)))
    return res.status(201).json({ ok: true })
  } catch (err) {
    console.error('applications hatası:', err)
    return res.status(500).json({ error: 'Sunucu hatası. Lütfen daha sonra tekrar dene.' })
  }
}
