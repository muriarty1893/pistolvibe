import type { VercelRequest } from '@vercel/node'

export function checkAdminAuth(req: VercelRequest): {
  ok: boolean
  status?: number
  error?: string
} {
  const password = process.env.ADMIN_PASSWORD
  if (!password) {
    return { ok: false, status: 500, error: 'ADMIN_PASSWORD ortam değişkeni tanımlı değil.' }
  }
  const key = req.headers['x-admin-key']
  const raw = Array.isArray(key) ? key[0] : key
  if (!raw || raw !== password) {
    return { ok: false, status: 401, error: 'Yetkisiz erişim.' }
  }
  return { ok: true }
}
