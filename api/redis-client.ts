// ── Minimal Redis client over TCP (RESP protocol) ──────────────────────
// Zero external dependencies, zero top-level imports.
// 'net' is imported dynamically at runtime so the serverless bundler
// never has to resolve Node.js built-ins at build time.

interface NetSocket {
  on(event: string, listener: (...args: any[]) => void): unknown
  off(event: string, listener: (...args: any[]) => void): unknown
  write(data: Buffer): boolean
  end(): unknown
  destroy(error?: Error): unknown
  setTimeout(ms: number): unknown
}

interface RedisConfig {
  host: string
  port: number
  password: string
}

function parseRedisUrl(url: string): RedisConfig {
  const u = new URL(url)
  return {
    host: u.hostname,
    port: parseInt(u.port || '6379', 10),
    password: decodeURIComponent(u.password || u.username || ''),
  }
}

// RESP protocol encoding: *N\r\n$len\r\narg\r\n...
function encodeCommand(args: string[]): Buffer {
  const parts: Buffer[] = [Buffer.from(`*${args.length}\r\n`)]
  for (const arg of args) {
    const b = Buffer.from(arg, 'utf-8')
    parts.push(Buffer.from(`$${b.length}\r\n`), b, Buffer.from('\r\n'))
  }
  return Buffer.concat(parts)
}

// RESP protocol parsing
function parseResp(buf: Buffer, offset: number): { value: unknown; next: number } | null {
  if (offset >= buf.length) return null
  const type = buf[offset]

  // Simple string: +OK\r\n
  if (type === 0x2b) {
    const end = buf.indexOf('\r\n', offset + 1)
    if (end === -1) return null
    return { value: buf.toString('utf-8', offset + 1, end), next: end + 2 }
  }

  // Error: -msg\r\n
  if (type === 0x2d) {
    const end = buf.indexOf('\r\n', offset + 1)
    if (end === -1) return null
    const msg = buf.toString('utf-8', offset + 1, end)
    return { value: new Error(msg), next: end + 2 }
  }

  // Integer: :123\r\n
  if (type === 0x3a) {
    const end = buf.indexOf('\r\n', offset + 1)
    if (end === -1) return null
    return { value: parseInt(buf.toString('utf-8', offset + 1, end), 10), next: end + 2 }
  }

  // Bulk string: $N\r\n...data...\r\n or $-1\r\n (null)
  if (type === 0x24) {
    const end = buf.indexOf('\r\n', offset + 1)
    if (end === -1) return null
    const len = parseInt(buf.toString('utf-8', offset + 1, end), 10)
    if (len === -1) return { value: null, next: end + 2 }
    const dataStart = end + 2
    const dataEnd = dataStart + len + 2 // +2 for trailing \r\n
    if (buf.length < dataEnd) return null
    return { value: buf.toString('utf-8', dataStart, dataStart + len), next: dataEnd }
  }

  // Array: *N\r\n...elements... or *-1\r\n (null)
  if (type === 0x2a) {
    const end = buf.indexOf('\r\n', offset + 1)
    if (end === -1) return null
    const count = parseInt(buf.toString('utf-8', offset + 1, end), 10)
    if (count === -1) return { value: null, next: end + 2 }
    let next = end + 2
    const items: unknown[] = []
    for (let i = 0; i < count; i++) {
      const r = parseResp(buf, next)
      if (!r) return null
      items.push(r.value)
      next = r.next
    }
    return { value: items, next }
  }

  return null
}

class RedisConnection {
  private socket: NetSocket
  private buf: Buffer = Buffer.alloc(0)
  private pending: Array<{ resolve: (v: unknown) => void; reject: (e: Error) => void }> = []

  constructor(socket: NetSocket) {
    this.socket = socket
    this.socket.on('data', (chunk: Buffer) => {
      this.buf = Buffer.concat([this.buf, chunk])
      this.drain()
    })
    this.socket.on('error', (err: Error) => {
      const p = this.pending.shift()
      if (p) p.reject(err)
    })
    this.socket.setTimeout(10_000)
    this.socket.on('timeout', () => {
      this.socket.destroy(new Error('Redis timeout (10s)'))
    })
  }

  async auth(password: string): Promise<void> {
    if (password) await this.command('AUTH', password)
  }

  command(...args: string[]): Promise<unknown> {
    return new Promise((resolve, reject) => {
      this.pending.push({ resolve, reject })
      this.socket.write(encodeCommand(args))
    })
  }

  quit(): void {
    try {
      this.socket.end()
    } catch {
      // ignore
    }
  }

  private drain() {
    while (this.pending.length > 0) {
      const result = parseResp(this.buf, 0)
      if (!result) return
      this.buf = this.buf.subarray(result.next)
      const { resolve, reject } = this.pending.shift()!
      if (result.value instanceof Error) reject(result.value)
      else resolve(result.value)
    }
  }
}

export interface RedisClient {
  lRange(key: string, start: number, stop: number): Promise<string[]>
  lPush(key: string, value: string): Promise<number>
  lRem(key: string, count: number, value: string): Promise<number>
  incr(key: string): Promise<number>
  expire(key: string, seconds: number): Promise<number>
  get(key: string): Promise<string | null>
  set(key: string, value: string): Promise<string | null>
  del(...keys: string[]): Promise<number>
}

export async function createRedisClient(url: string): Promise<RedisClient & { close(): void }> {
  const config = parseRedisUrl(url)

  // Dinamik import — bundler build sırasında işlemez, Node.js çalışma zamanında çözer
  const netModule: any = await import('net')
  const createConnection = netModule.createConnection || netModule.default?.createConnection
  if (typeof createConnection !== 'function') {
    throw new Error("net.createConnection bulunamadı (dinamik import başarısız).")
  }

  const socket: NetSocket = createConnection({ host: config.host, port: config.port })
  const conn = new RedisConnection(socket)

  // Socket bağlanana kadar bekle, sonra AUTH yap
  await new Promise<void>((resolve, reject) => {
    const onError = (err: Error) => reject(err)
    socket.on('error', onError)
    socket.on('connect', async () => {
      socket.off('error', onError)
      try {
        await conn.auth(config.password)
        resolve()
      } catch (err) {
        reject(err)
      }
    })
  })

  return {
    async lRange(key, start, stop) {
      const res = await conn.command('LRANGE', key, String(start), String(stop))
      return (res as unknown[] ?? []) as string[]
    },
    async lPush(key, value) {
      const res = await conn.command('LPUSH', key, value)
      return res as number
    },
    async lRem(key, count, value) {
      const res = await conn.command('LREM', key, String(count), value)
      return res as number
    },
    async incr(key) {
      const res = await conn.command('INCR', key)
      return res as number
    },
    async expire(key, seconds) {
      const res = await conn.command('EXPIRE', key, String(seconds))
      return res as number
    },
    async get(key) {
      return (await conn.command('GET', key)) as string | null
    },
    async set(key, value) {
      return (await conn.command('SET', key, value)) as string | null
    },
    async del(...keys) {
      const res = await conn.command('DEL', ...keys)
      return res as number
    },
    close() {
      conn.quit()
    },
  }
}

// ── Helpers shared by API functions ──

async function getClient(): Promise<RedisClient & { close(): void }> {
  const url = process.env.REDIS_URL
  if (!url) throw new Error('REDIS_URL ortam değişkeni tanımlı değil.')
  return createRedisClient(url)
}

export async function withRedis<T>(fn: (client: RedisClient) => Promise<T>): Promise<T> {
  const client = await getClient()
  try {
    return await fn(client)
  } finally {
    client.close()
  }
}

export async function isRateLimited(
  client: RedisClient,
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
