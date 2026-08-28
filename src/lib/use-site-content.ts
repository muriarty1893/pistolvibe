import { useEffect, useState } from 'react'

export interface SiteContent {
  stats: Array<{ id: string; value: number; suffix: string; label: string }>
  arsenal: Array<{ id: string; name: string; href?: string }>
  gallery: Array<{ id: string; url: string; caption?: string }>
  events: Array<{ id: string; title: string; date: string; location: string; description?: string }>
}

// Varsayılanlar API erişilemezse / içerik hiç kaydedilmediyse kullanılır.
export const DEFAULT_STATS: SiteContent['stats'] = [
  { id: 'stat-members', value: 25, suffix: '+', label: 'Aktif Üye' },
  { id: 'stat-matches', value: 40, suffix: '+', label: 'Oynanan Maç' },
  { id: 'stat-bullets', value: 12500, suffix: '+', label: 'Atılan Airsoft Mermisi' },
  { id: 'stat-founded', value: 2026, suffix: '', label: 'Kuruluş Yılı' },
]

export const DEFAULT_ARSENAL: SiteContent['arsenal'] = [
  {
    id: 'arsenal-ssp5',
    name: 'NOVRITSCH SSP5 6" GBB',
    href: 'https://eu.novritsch.com/product/ssp5-gas-blowback-pistol/',
  },
  { id: 'arsenal-glock17', name: 'Glock 17 Gen 4', href: 'https://weairsoft.com/we-g001b-bk.html' },
]

export const DEFAULT_EVENTS: SiteContent['events'] = []

const FALLBACK: SiteContent = {
  stats: DEFAULT_STATS,
  arsenal: DEFAULT_ARSENAL,
  gallery: [],
  events: DEFAULT_EVENTS,
}

let cache: SiteContent | null = null

export function useSiteContent() {
  const [content, setContent] = useState<SiteContent>(cache ?? FALLBACK)

  useEffect(() => {
    let cancelled = false
    fetch('/api/content')
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('failed'))))
      .then((data: SiteContent) => {
        if (cancelled || !data || typeof data !== 'object') return
        const next: SiteContent = {
          stats: Array.isArray(data.stats) && data.stats.length > 0 ? data.stats : DEFAULT_STATS,
          arsenal:
            Array.isArray(data.arsenal) && data.arsenal.length > 0
              ? data.arsenal
              : DEFAULT_ARSENAL,
          gallery: Array.isArray(data.gallery) ? data.gallery : [],
          events: Array.isArray(data.events) ? data.events : DEFAULT_EVENTS,
        }
        cache = next
        setContent(next)
      })
      .catch(() => {
        // sessizce varsayılanlarda kal
      })
    return () => {
      cancelled = true
    }
  }, [])

  return content
}
