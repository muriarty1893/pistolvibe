import { createClient } from 'redis'

// Vercel Redis (node-redis) bağlantısı: serverless istekleri arasında
// sıcak tutulan tek bir client yeniden kullanılır.

interface RedisLike {
  connect(): Promise<unknown>
  on(event: 'error', listener: (err: Error) => void): unknown
  lRange(key: string, start: number, stop: number): Promise<string[]>
  lPush(key: string, value: string): Promise<number>
  incr(key: string): Promise<number>
  expire(key: string, seconds: number): Promise<number>
}

let clientPromise: Promise<RedisLike> | null = null

function getClient(): Promise<RedisLike> {
  if (!clientPromise) {
    const url = process.env.REDIS_URL
    if (!url) {
      clientPromise = Promise.reject(new Error('REDIS_URL ortam değişkeni tanımlı değil.'))
      return clientPromise
    }
    const client = createClient({ url }) as unknown as RedisLike
    client.on('error', (err) => console.error('Redis hatası:', err))
    clientPromise = client.connect().then(() => client)
  }
  return clientPromise
}

export async function withRedis<T>(fn: (client: RedisLike) => Promise<T>): Promise<T> {
  try {
    const client = await getClient()
    return await fn(client)
  } catch (err) {
    // Bağlantı kopmuş olabilir; bir sonraki istekte taze bağlantı açılsın
    clientPromise = null
    throw err
  }
}

// Hız sınırı: IP başına dakikada 10 istek
export async function isRateLimited(
  client: RedisLike,
  ip: string,
  bucket: string
): Promise<boolean> {
  const key = `rl:${bucket}:${ip}`
  const count = await client.incr(key)
  if (count === 1) await client.expire(key, 60)
  return count > 10
}

export function getClientIp(req: {
  headers: Record<string, string | string[] | undefined>
  socket?: { remoteAddress?: string }
}): string {
  const forwarded = req.headers['x-forwarded-for']
  const raw = Array.isArray(forwarded) ? forwarded[0] : forwarded
  return raw?.split(',')[0].trim() || req.socket?.remoteAddress || 'unknown'
}

export const clean = (value: unknown, max = 500): string =>
  String(value ?? '')
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, max)
