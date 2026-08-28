import type { VercelRequest, VercelResponse } from '@vercel/node'
import { del, put } from '@vercel/blob'
import { withRedis } from './redis-client.js'
import {
  CONTENT_KEY,
  MAX_GALLERY_ITEMS,
  parseStoredContent,
  sanitizeContent,
} from './_content.js'
import { checkAdminAuth } from './_admin-auth.js'

// PUT /api/admin-content          → tüm site içeriğini kaydet ({ stats, arsenal, gallery })
// POST /api/admin-content         → aksiyonlar:
//   { action: 'upload', filename, contentType, data }  → base64 fotoğraf yükle (Vercel Blob)
//   { action: 'blob-delete', url }                     → Blob'tan dosya sil
//
// Not: Sunucusuz fonksiyon gövde sınırı ~4.5MB olduğundan yükleme üst sınırı 3.5MB'dir.
// Fotoğraf URL'si döner; admin UI galeri listesine ekler ve PUT ile kalıcılaştırır.

const MAX_UPLOAD_BYTES = 3.5 * 1024 * 1024 // 3.5MB (base64 öncesi ham boyut)
const ALLOWED_TYPES: Record<string, string> = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/avif': '.avif',
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const auth = checkAdminAuth(req)
  if (!auth.ok) {
    return res.status(auth.status ?? 500).json({ error: auth.error })
  }

  try {
    if (req.method === 'PUT') {
      const content = sanitizeContent({
        stats: req.body?.stats,
        arsenal: req.body?.arsenal,
        gallery: req.body?.gallery,
        events: req.body?.events,
      })
      await withRedis((client) => client.set(CONTENT_KEY, JSON.stringify(content)))
      return res.status(200).json({ ok: true })
    }

    if (req.method === 'POST') {
      const action = String(req.body?.action || '')

      if (action === 'upload') {
        return await handleUpload(req, res)
      }

      if (action === 'blob-delete') {
        const url = String(req.body?.url || '')
        if (!/^https:\/\//.test(url)) {
          return res.status(400).json({ error: 'Geçersiz Blob URL.' })
        }
        try {
          await del(url)
        } catch {
          // dosya zaten silinmiş olabilir — yut
        }
        return res.status(200).json({ ok: true })
      }

      return res.status(400).json({ error: 'Geçersiz istek.' })
    }

    res.setHeader('Allow', 'PUT, POST')
    return res.status(405).json({ error: 'Bu yöntem desteklenmiyor.' })
  } catch (err) {
    console.error('admin-content hatası:', err)
    return res.status(500).json({ error: 'Sunucu hatası. Lütfen daha sonra tekrar dene.' })
  }
}

async function handleUpload(req: VercelRequest, res: VercelResponse) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return res.status(501).json({
      error:
        'BLOB_READ_WRITE_TOKEN tanımlı değil. Vercel projene bir Blob store bağlaman gerekiyor.',
    })
  }

  const contentType = String(req.body?.contentType || '')
  const ext = ALLOWED_TYPES[contentType]
  if (!ext) {
    return res.status(400).json({ error: 'Sadece PNG/JPG/WEBP/GIF/AVIF yükleyebilirsin.' })
  }

  const dataB64 = String(req.body?.data || '')
  if (!dataB64) {
    return res.status(400).json({ error: 'Dosya verisi bulunamadı.' })
  }

  const buffer = Buffer.from(dataB64, 'base64')
  if (buffer.length === 0) {
    return res.status(400).json({ error: 'Dosya verisi boş.' })
  }
  if (buffer.length > MAX_UPLOAD_BYTES) {
    return res.status(413).json({ error: 'Fotoğraf çok büyük (maks 3.5MB).' })
  }

  // Galeri kapasitesi kontrolü
  const raw = await withRedis((client) => client.get(CONTENT_KEY))
  const current = parseStoredContent(raw)
  if (current.gallery.length >= MAX_GALLERY_ITEMS) {
    return res
      .status(409)
      .json({ error: `Galeride maks ${MAX_GALLERY_ITEMS} fotoğraf olabilir.` })
  }

  const blob = await put(`gallery/${Date.now().toString(36)}${ext}`, buffer, {
    access: 'public',
    contentType,
    addRandomSuffix: true,
  })

  return res.status(201).json({
    ok: true,
    item: {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      url: blob.url,
      caption: '',
    },
  })
}
