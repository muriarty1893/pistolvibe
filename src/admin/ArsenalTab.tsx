import { useEffect, useState } from 'react'
import { Loader2, Plus, Save, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  runWithToast,
  saveSiteContent,
  uid,
  type AdminData,
  type ArsenalItem,
} from '@/admin/shared'

interface Props {
  data: AdminData
  adminKey: string
}

export function ArsenalTab({ data, adminKey }: Props) {
  const [arsenal, setArsenal] = useState<ArsenalItem[]>(data.content.arsenal)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!dirty) setArsenal(data.content.arsenal)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.content.arsenal])

  function update(id: string, patch: Partial<ArsenalItem>) {
    setArsenal((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)))
    setDirty(true)
  }

  function addPistol() {
    setArsenal((prev) => [...prev, { id: uid(), name: '', href: '' }])
    setDirty(true)
  }

  const invalid = arsenal.some((a) => !a.name.trim())

  async function handleSave() {
    if (invalid || arsenal.length < 1) return
    setSaving(true)
    const ok = await runWithToast(
      () =>
        saveSiteContent(adminKey, {
          stats: data.content.stats,
          arsenal: arsenal.map((a) => ({ ...a, href: a.href?.trim() || undefined })),
          gallery: data.content.gallery,
        }),
      'Cephanelik kaydedildi'
    )
    setSaving(false)
    if (ok) setDirty(false)
  }

  return (
    <div className="flex max-w-4xl flex-col gap-4">
      <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card/60 p-4">
        {invalid && (
          <span className="text-xs font-medium text-destructive">Her tabancanın adı olmalı.</span>
        )}
        <Button size="sm" variant="outline" onClick={addPistol} className="ml-auto cursor-pointer">
          <Plus className="h-4 w-4" aria-hidden="true" />
          Tabanca Ekle
        </Button>
      </div>

      <p className="-mt-2 text-xs text-muted-foreground">
        İsim sitede kayan bantta gösterilir; bağlantı girersen isim tıklanabilir olur (opsiyonel).
      </p>

      {arsenal.map((pistol, i) => (
        <div
          key={pistol.id}
          className="rounded-lg border border-border bg-card/60 p-4"
        >
          {/* Mobil: sıra başlığı + sil düğmesi üstte */}
          <div className="mb-3 flex items-center justify-between sm:hidden">
            <span className="text-xs uppercase tracking-widest text-muted-foreground">#{i + 1}</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setArsenal((prev) => prev.filter((a) => a.id !== pistol.id))
                setDirty(true)
              }}
              className="cursor-pointer text-destructive hover:bg-destructive/10 hover:text-destructive"
              aria-label={`${pistol.name} tabancasını sil`}
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-[6rem_1fr_1.5fr_auto] sm:items-center">
            <span className="hidden text-xs uppercase tracking-widest text-muted-foreground sm:block">
              #{i + 1}
            </span>
            <Input
              value={pistol.name}
              onChange={(e) => update(pistol.id, { name: e.target.value })}
              placeholder="Tabanca adı (örn. Glock 17 Gen 4)"
              maxLength={80}
              className="col-span-2 sm:col-span-1"
            />
            <Input
              value={pistol.href ?? ''}
              onChange={(e) => update(pistol.id, { href: e.target.value })}
              placeholder="Ürün sayfası bağlantısı (https://...)"
              type="url"
              inputMode="url"
              className="col-span-2 sm:col-span-1"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setArsenal((prev) => prev.filter((a) => a.id !== pistol.id))
                setDirty(true)
              }}
              className="hidden cursor-pointer text-destructive hover:bg-destructive/10 hover:text-destructive sm:inline-flex"
              aria-label={`${pistol.name} tabancasını sil`}
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      ))}

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={!dirty || invalid || saving} className="cursor-pointer">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}
          Kaydet
        </Button>
      </div>
    </div>
  )
}
