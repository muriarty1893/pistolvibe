import { useEffect, useState } from 'react'
import { Loader2, Plus, Save, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  runWithToast,
  saveSiteContent,
  uid,
  type AdminData,
  type StatItem,
} from '@/admin/shared'

interface Props {
  data: AdminData
  adminKey: string
}

export function StatsTab({ data, adminKey }: Props) {
  const [stats, setStats] = useState<StatItem[]>(data.content.stats)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!dirty) setStats(data.content.stats)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.content.stats])

  function update(id: string, patch: Partial<StatItem>) {
    setStats((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)))
    setDirty(true)
  }

  function addStat() {
    if (stats.length >= 8) return
    setStats((prev) => [...prev, { id: uid(), value: 0, suffix: '+', label: '' }])
    setDirty(true)
  }

  function removeStat(id: string) {
    setStats((prev) => prev.filter((s) => s.id !== id))
    setDirty(true)
  }

  const invalid = stats.some((s) => !s.label.trim() || !Number.isFinite(s.value))

  async function handleSave() {
    if (invalid || stats.length < 2) return
    setSaving(true)
    const ok = await runWithToast(
      () =>
        saveSiteContent(adminKey, {
          stats,
          arsenal: data.content.arsenal,
          gallery: data.content.gallery,
        }),
      'İstatistikler kaydedildi'
    )
    setSaving(false)
    if (ok) setDirty(false)
  }

  return (
    <div className="flex max-w-3xl flex-col gap-4">
      <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card/60 p-4">
        <div className="flex items-center gap-3">
          {invalid && (
            <span className="text-xs font-medium text-destructive">
              Her istatistiğin etiketi ve geçerli bir değeri olmalı.
            </span>
          )}
        </div>
        <Button size="sm" variant="outline" onClick={addStat} disabled={stats.length >= 8} className="cursor-pointer">
          <Plus className="h-4 w-4" aria-hidden="true" />
          İstatistik Ekle
        </Button>
      </div>

      <p className="-mt-2 text-xs text-muted-foreground">
        Değer sitenin ön yüzünde sayaç animasyonuyla gösterilir; büyük sayılarda binlik ayraç otomatik eklenir. Sonek alanına “+”, “K+”, “%” gibi kısa ifadeler girebilirsin (maks 3 karakter). Maks 8 istatistik.
      </p>

      {stats.map((stat, i) => (
        <div key={stat.id} className="rounded-lg border border-border bg-card/60 p-4">
          {/* Mobil: sıra başlığı + sil düğmesi üstte */}
          <div className="mb-3 flex items-center justify-between sm:hidden">
            <span className="text-xs uppercase tracking-widest text-muted-foreground">#{i + 1}</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => removeStat(stat.id)}
              disabled={stats.length <= 2}
              className="cursor-pointer text-destructive hover:bg-destructive/10 hover:text-destructive"
              aria-label={`${stat.label} istatistiğini sil`}
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-[7rem_1fr_6rem_6rem_auto] sm:items-center">
            <span className="hidden text-xs uppercase tracking-widest text-muted-foreground sm:block">
              #{i + 1}
            </span>
            <Input
              value={stat.label}
              onChange={(e) => update(stat.id, { label: e.target.value })}
              placeholder="Etiket (örn. Aktif Üye)"
              maxLength={40}
              className="col-span-2 sm:col-span-1"
            />
            <Input
              type="number"
              value={stat.value}
              onChange={(e) => update(stat.id, { value: Math.floor(Number(e.target.value)) || 0 })}
              placeholder="Değer"
              min={0}
              max={100_000_000}
            />
            <Input
              value={stat.suffix}
              onChange={(e) => update(stat.id, { suffix: e.target.value.slice(0, 3) })}
              placeholder="Sonek"
              maxLength={3}
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => removeStat(stat.id)}
              disabled={stats.length <= 2}
              className="hidden cursor-pointer text-destructive hover:bg-destructive/10 hover:text-destructive sm:inline-flex"
              aria-label={`${stat.label} istatistiğini sil`}
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      ))}

      <div className="flex justify-end">
        <Button onClick={() => handleSave()} disabled={!dirty || invalid || saving} className="cursor-pointer">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}
          Kaydet
        </Button>
      </div>
    </div>
  )
}
