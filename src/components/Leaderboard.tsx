import { useCallback, useEffect, useState } from 'react'

import { SectionHeading } from '@/components/SectionHeading'
import { Reveal } from '@/components/Reveal'
import { cn } from '@/lib/utils'

interface ScoreRow {
  id: string
  callsign: string
  score: number
  accuracy: number
  bestStreak: number
  createdAt: string
}

export function Leaderboard() {
  const [rows, setRows] = useState<ScoreRow[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/scores')
      if (res.ok) setRows(await res.json())
    } catch {
      // sessizce geç
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
    const onUpdated = () => void load()
    window.addEventListener('pv-scores-updated', onUpdated)
    return () => window.removeEventListener('pv-scores-updated', onUpdated)
  }, [load])

  return (
    <section id="tablo" className="relative py-24">
      <div className="container mx-auto px-6">
        <SectionHeading
          badge="Şeref Tablosu"
          title="Arenanın Efsaneleri"
          description="En yüksek skorlar, en keskin gözler. Adını buraya yazdır."
        />

        <Reveal className="mx-auto max-w-3xl">
          <div className="overflow-hidden rounded-md border-2 border-foreground/15 bg-card shadow-[6px_6px_0_0_rgba(35,33,28,0.06)]">
            <div className="stencil-label grid grid-cols-[3rem_1fr_5rem_5rem] items-center gap-2 border-b-2 border-foreground/15 bg-secondary/60 px-4 py-3 text-muted-foreground sm:grid-cols-[3rem_1fr_6rem_6rem_6rem]">
              <span>#</span>
              <span>Çağrı Adı</span>
              <span className="text-right">Skor</span>
              <span className="text-right">İsabet</span>
              <span className="hidden text-right sm:block">Seri</span>
            </div>

            {loading ? (
              <p className="px-4 py-10 text-center text-sm text-muted-foreground">Yükleniyor…</p>
            ) : rows.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-muted-foreground">
                Henüz kimse adını yazdıramadı. İlk efsane sen olabilirsin.
              </p>
            ) : (
              <ul>
                {rows.map((row, i) => (
                  <li
                    key={row.id}
                    className={cn(
                      'grid grid-cols-[3rem_1fr_5rem_5rem] items-center gap-2 px-4 py-3 text-sm transition-colors duration-200 hover:bg-primary/5 sm:grid-cols-[3rem_1fr_6rem_6rem_6rem]',
                      i % 2 === 1 && 'bg-secondary/30'
                    )}
                  >
                    <span className="flex items-center">
                      {i < 3 ? (
                        <span
                          className={cn(
                            'inline-flex h-7 w-7 items-center justify-center border-2 font-display',
                            i === 0 && 'border-brass-deep bg-brass-deep/10 text-brass-deep',
                            i === 1 && 'border-foreground/40 text-foreground/70',
                            i === 2 && 'border-foreground/25 text-foreground/50'
                          )}
                          aria-label={`${i + 1}. sıra`}
                        >
                          {i + 1}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">{i + 1}</span>
                      )}
                    </span>
                    <span className="truncate font-medium text-foreground">{row.callsign}</span>
                    <span className="text-right font-display tabular-nums text-primary">
                      {row.score.toLocaleString('tr-TR')}
                    </span>
                    <span className="text-right tabular-nums text-muted-foreground">
                      {row.accuracy}%
                    </span>
                    <span className="hidden text-right tabular-nums text-muted-foreground sm:block">
                      {row.bestStreak}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  )
}
