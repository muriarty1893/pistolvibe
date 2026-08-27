import { toast } from 'sonner'

// ── Paylaşılan tipler ──

export interface Application {
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

export interface Comment {
  id: string
  name: string
  pistol: string
  message: string
  createdAt: string
}

export interface ScoreRow {
  id: string
  callsign: string
  score: number
  accuracy: number
  bestStreak: number
  createdAt: string
}

export interface StatItem {
  id: string
  value: number
  suffix: string
  label: string
}

export interface ArsenalItem {
  id: string
  name: string
  href?: string
}

export interface GalleryItem {
  id: string
  url: string
  caption?: string
}

export interface SiteContent {
  stats: StatItem[]
  arsenal: ArsenalItem[]
  gallery: GalleryItem[]
  updatedAt?: string
}

export interface AdminData {
  comments: Comment[]
  applications: Application[]
  scores: ScoreRow[]
  content: SiteContent
}

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
export { uid }

// ── API yardımcıları ──

function errorFrom(res: Response, body: unknown): Error {
  const msg =
    body && typeof body === 'object' && 'error' in body && typeof (body as any).error === 'string'
      ? (body as any).error
      : 'Bir hata oluştu.'
  return new Error(msg)
}

export async function fetchAdminData(key: string): Promise<AdminData> {
  const res = await fetch('/api/admin', { headers: { 'x-admin-key': key } })
  const body = await res.json().catch(() => null)
  if (!res.ok) throw errorFrom(res, body)
  return body as AdminData
}

async function postAction<T = unknown>(key: string, payload: Record<string, unknown>): Promise<T> {
  const res = await fetch('/api/admin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-admin-key': key },
    body: JSON.stringify(payload),
  })
  const body = await res.json().catch(() => null)
  if (!res.ok) throw errorFrom(res, body)
  return body as T
}

export const updateComment = (
  key: string,
  c: Pick<Comment, 'id' | 'name' | 'pistol' | 'message'>
) => postAction(key, { action: 'comment-update', ...c })

export const deleteCommentFromApi = (key: string, id: string) =>
  postAction(key, { action: 'comment-delete', id })

export const deleteApplication = (key: string, id: string) =>
  postAction(key, { action: 'application-delete', id })

export const addScore = (
  key: string,
  row: Pick<ScoreRow, 'callsign' | 'score' | 'accuracy' | 'bestStreak'>
) => postAction<ScoreRow>(key, { action: 'score-add', ...row })

export const updateScore = (
  key: string,
  row: Pick<ScoreRow, 'id' | 'callsign' | 'score' | 'accuracy' | 'bestStreak'> & Partial<ScoreRow>
) => postAction(key, { action: 'score-update', ...row })

export const deleteScore = (key: string, id: string) =>
  postAction(key, { action: 'score-delete', id })

// Tüm site içeriğini kaydet (istatistikler + cephanelik + galeri tek doküman)
export async function saveSiteContent(
  key: string,
  content: Pick<SiteContent, 'stats' | 'arsenal' | 'gallery'>
): Promise<void> {
  const res = await fetch('/api/admin-content', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'x-admin-key': key },
    body: JSON.stringify(content),
  })
  const body = await res.json().catch(() => null)
  if (!res.ok) throw errorFrom(res, body)
}

export async function uploadGalleryPhoto(key: string, file: File): Promise<GalleryItem> {
  const MAX_UPLOAD_BYTES = 3.5 * 1024 * 1024
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw new Error('Sadece PNG/JPG/WEBP/GIF/AVIF yükleyebilirsin.')
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error('Fotoğraf çok büyük (maks 3.5MB).')
  }
  const buffer = await file.arrayBuffer()
  let binary = ''
  const bytes = new Uint8Array(buffer)
  const CHUNK = 0x8000
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK))
  }
  const res = await fetch('/api/admin-content', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-admin-key': key },
    body: JSON.stringify({
      action: 'upload',
      filename: file.name,
      contentType: file.type,
      data: btoa(binary),
    }),
  })
  const body = await res.json().catch(() => null)
  if (!res.ok) throw errorFrom(res, body)
  return (body as { item: GalleryItem }).item
}

const ALLOWED_IMAGE_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'image/avif',
])

export async function deleteBlobPhoto(key: string, url: string): Promise<void> {
  const res = await fetch('/api/admin-content', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-admin-key': key },
    body: JSON.stringify({ action: 'blob-delete', url }),
  })
  // blob silme hatası kritik değil — sessiz geç
  void res
}

/** Yeni bölüm ekleyen küçük yardımcı — hataları toast ile gösterir. */
export async function runWithToast(fn: () => unknown, successMsg?: string): Promise<boolean> {
  try {
    await fn()
    if (successMsg) toast.success(successMsg)
    return true
  } catch (err) {
    toast.error('İşlem başarısız', {
      description: err instanceof Error ? err.message : 'Bir hata oluştu.',
    })
    return false
  }
}
