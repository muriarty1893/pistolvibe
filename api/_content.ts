// ── Ortak site içeriği (istatistikler, cephanelik, galeri) ──
// Redis 'content' anahtarında tek JSON doküman olarak saklanır.
// Admin hiçbir şey kaydetmediyse varsayılanlar kullanılır.

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

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7)

export const DEFAULT_STATS: StatItem[] = [
  { id: 'stat-members', value: 25, suffix: '+', label: 'Aktif Üye' },
  { id: 'stat-matches', value: 40, suffix: '+', label: 'Oynanan Maç' },
  { id: 'stat-bullets', value: 12500, suffix: '+', label: 'Atılan Airsoft Mermisi' },
  { id: 'stat-founded', value: 2026, suffix: '', label: 'Kuruluş Yılı' },
]

export const DEFAULT_ARSENAL: ArsenalItem[] = [
  {
    id: uid(),
    name: 'NOVRITSCH SSP5 6" GBB',
    href: 'https://eu.novritsch.com/product/ssp5-gas-blowback-pistol/',
  },
  { id: uid(), name: 'Glock 17 Gen 4', href: 'https://weairsoft.com/we-g001b-bk.html' },
]

export const DEFAULT_CONTENT: SiteContent = {
  stats: DEFAULT_STATS,
  arsenal: DEFAULT_ARSENAL,
  gallery: [],
}

export const CONTENT_KEY = 'content'
export const MAX_GALLERY_ITEMS = 60

// Gelen veriyi güvenli hale getir; eksik alanlarda mevcut/varsayılana düş.
export function sanitizeStats(input: unknown): StatItem[] | null {
  if (!Array.isArray(input)) return null
  return input.slice(0, 20).map((raw) => ({
    id: typeof raw?.id === 'string' && raw.id ? raw.id : uid(),
    value: Math.floor(Number(raw?.value)) || 0,
    suffix: String(raw?.suffix ?? '').slice(0, 3),
    label: String(raw?.label ?? '').replace(/[<>]/g, '').trim().slice(0, 40),
  }))
}

export function sanitizeArsenal(input: unknown): ArsenalItem[] | null {
  if (!Array.isArray(input)) return null
  return input
    .slice(0, 30)
    .map((raw) => {
      let href: string | undefined
      if (typeof raw?.href === 'string' && raw.href.trim()) {
        try {
          const url = new URL(raw.href.trim())
          // javascript:, data: vb. şemaları engelle
          if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new Error('bad')
          href = url.toString()
        } catch {
          href = undefined
        }
      }
      return {
        id: typeof raw?.id === 'string' && raw.id ? raw.id : uid(),
        name: String(raw?.name ?? '').replace(/[<>]/g, '').trim().slice(0, 80),
        href,
      }
    })
    .filter((item) => item.name)
}

export function sanitizeGallery(input: unknown): GalleryItem[] | null {
  if (!Array.isArray(input)) return null
  return input
    .slice(0, MAX_GALLERY_ITEMS)
    .map((raw) => {
      let url = ''
      if (typeof raw?.url === 'string') {
        try {
          const u = new URL(raw.url)
          if (u.protocol === 'https:' || u.protocol === 'http:') url = u.toString()
        } catch {
          url = ''
        }
      }
      return {
        id: typeof raw?.id === 'string' && raw.id ? raw.id : uid(),
        url,
        caption: String(raw?.caption ?? '')
          .replace(/[<>]/g, '')
          .trim()
          .slice(0, 120),
      }
    })
    .filter((item) => item.url)
}

export function sanitizeContent(input: unknown): SiteContent {
  const base =
    typeof input === 'object' && input !== null ? (input as Partial<SiteContent>) : {}
  return {
    stats: sanitizeStats(base.stats) ?? DEFAULT_STATS,
    arsenal: sanitizeArsenal(base.arsenal) ?? DEFAULT_ARSENAL,
    gallery: sanitizeGallery(base.gallery) ?? [],
    updatedAt: new Date().toISOString(),
  }
}

export function parseStoredContent(raw: string | null | undefined): SiteContent {
  if (!raw) return DEFAULT_CONTENT
  try {
    const parsed = JSON.parse(raw)
    return sanitizeContent(parsed)
  } catch {
    return DEFAULT_CONTENT
  }
}
