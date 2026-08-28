import { useEffect, useState } from 'react'
import { Loader2, Plus, Save, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  runWithToast,
  saveSiteContent,
  uid,
  type AdminData,
  type EventItem,
} from '@/admin/shared'

interface Props {
  data: AdminData
  adminKey: string
}

export function EventsTab({ data, adminKey }: Props) {
  const [events, setEvents] = useState<EventItem[]>(data.content.events)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!dirty) setEvents(data.content.events)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.content.events])

  function update(id: string, patch: Partial<EventItem>) {
    setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)))
    setDirty(true)
  }

  function addEvent() {
    setEvents((prev) => [
      ...prev,
      { id: uid(), title: '', date: '', location: '', description: '' },
    ])
    setDirty(true)
  }

  const invalid = events.some((e) => !e.title.trim() || !e.date.trim())

  async function handleSave() {
    if (invalid) return
    setSaving(true)
    const ok = await runWithToast(
      () =>
        saveSiteContent(adminKey, {
          stats: data.content.stats,
          arsenal: data.content.arsenal,
          gallery: data.content.gallery,
          events: events.map((e) => ({
            ...e,
            title: e.title.trim(),
            date: e.date.trim(),
            location: e.location.trim(),
            description: e.description?.trim() || undefined,
          })),
        }),
      'Etkinlikler kaydedildi'
    )
    setSaving(false)
    if (ok) setDirty(false)
  }

  return (
    <div className="flex max-w-4xl flex-col gap-4">
      <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card/60 p-4">
        {invalid && (
          <span className="text-xs font-medium text-destructive">
            Her etkinliğin başlığı ve tarihi olmalı.
          </span>
        )}
        <Button size="sm" variant="outline" onClick={addEvent} className="ml-auto cursor-pointer">
          <Plus className="h-4 w-4" aria-hidden="true" />
          Etkinlik Ekle
        </Button>
      </div>

      <p className="-mt-2 text-xs text-muted-foreground">
        Tarih alanına etkinliğin görünecek şekliyle yaz (örn. 12 Eylül 2026). Sitede giriş
        sırasına göre listelenir.
      </p>

      {events.map((event, i) => (
        <div key={event.id} className="rounded-lg border border-border bg-card/60 p-4">
          {/* Mobil: sıra başlığı + sil düğmesi üstte */}
          <div className="mb-3 flex items-center justify-between sm:hidden">
            <span className="text-xs uppercase tracking-widest text-muted-foreground">#{i + 1}</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setEvents((prev) => prev.filter((e) => e.id !== event.id))
                setDirty(true)
              }}
              className="cursor-pointer text-destructive hover:bg-destructive/10 hover:text-destructive"
              aria-label={`${event.title || 'Etkinlik'} kaydını sil`}
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-[6rem_1fr_10rem_1fr_auto] sm:items-center">
            <span className="hidden text-xs uppercase tracking-widest text-muted-foreground sm:block">
              #{i + 1}
            </span>
            <Input
              value={event.title}
              onChange={(e) => update(event.id, { title: e.target.value })}
              placeholder="Etkinlik adı (örn. Hafta Sonu Savaşı)"
              maxLength={80}
              className="col-span-2 sm:col-span-1"
            />
            <Input
              value={event.date}
              onChange={(e) => update(event.id, { date: e.target.value })}
              placeholder="Tarih (örn. 12 Eylül)"
              maxLength={40}
              className="col-span-1"
            />
            <Input
              value={event.location}
              onChange={(e) => update(event.id, { location: e.target.value })}
              placeholder="Yer (örn. Adana CQB Sahası)"
              maxLength={80}
              className="col-span-1"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setEvents((prev) => prev.filter((e) => e.id !== event.id))
                setDirty(true)
              }}
              className="hidden cursor-pointer text-destructive hover:bg-destructive/10 hover:text-destructive sm:inline-flex"
              aria-label={`${event.title || 'Etkinlik'} kaydını sil`}
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>

          <Textarea
            value={event.description ?? ''}
            onChange={(e) => update(event.id, { description: e.target.value })}
            placeholder="Açıklama (opsiyonel)"
            maxLength={400}
            className="mt-3"
            rows={2}
          />
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
