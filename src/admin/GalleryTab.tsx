import { useEffect, useRef, useState } from 'react'
import { ImagePlus, Loader2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import {
  deleteBlobPhoto,
  runWithToast,
  saveSiteContent,
  uploadGalleryPhoto,
  type AdminData,
  type GalleryItem,
} from '@/admin/shared'

interface Props {
  data: AdminData
  adminKey: string
  onChanged: () => unknown
}

export function GalleryTab({ data, adminKey, onChanged }: Props) {
  const [items, setItems] = useState<GalleryItem[]>(data.content.gallery)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // Sunucudan yeni veri geldiğinde kaydedilmemiş değişiklik yoksa eşitle
  useEffect(() => {
    if (!dirty) setItems(data.content.gallery)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.content.gallery])

  function update(id: string, patch: Partial<GalleryItem>) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)))
    setDirty(true)
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    setUploading(true)
    const uploaded: GalleryItem[] = []
    for (const file of Array.from(files)) {
      try {
        const item = await uploadGalleryPhoto(adminKey, file)
        uploaded.push(item)
      } catch (err) {
        toast.error(`${file.name} yüklenemedi`, {
          description: err instanceof Error ? err.message : 'Bir hata oluştu.',
        })
      }
    }
    setUploading(false)
    if (uploaded.length > 0) {
      setItems((prev) => [...uploaded, ...prev])
      setDirty(true)
      if (uploaded.length > 1) toast.success(`${uploaded.length} fotoğraf yüklendi`)
    }
    if (fileRef.current) fileRef.current.value = ''
  }

  async function persistGallery(list: GalleryItem[]): Promise<boolean> {
    setSaving(true)
    const ok = await runWithToast(
      () =>
        saveSiteContent(adminKey, {
          stats: data.content.stats,
          arsenal: data.content.arsenal,
          gallery: list,
          events: data.content.events,
        }),
      'Galeri kaydedildi'
    )
    setSaving(false)
    return ok
  }

  async function handleRemove(item: GalleryItem) {
    if (!window.confirm('Bu fotoğraf kalıcı olarak silinsin mi?')) return
    const next = items.filter((it) => it.id !== item.id)
    setItems(next)
    // Blob'u sil ve listeyi aynı anda kalıcılaştır — yarım kalmış durum kalmasın
    const deleted = await runWithToast(() => deleteBlobPhoto(adminKey, item.url))
    if (!deleted) return
    if (await persistGallery(next)) {
      setDirty(false)
      await onChanged()
    } else {
      setDirty(true)
    }
  }

  const isBlocked = saving || uploading

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card/60 p-4">
        <label
          className={cn(
            'inline-flex cursor-pointer items-center gap-2 rounded-md border border-primary/40 bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition-colors duration-200 hover:bg-primary/20',
            isBlocked && 'pointer-events-none opacity-50'
          )}
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <ImagePlus className="h-4 w-4" aria-hidden="true" />
          )}
          {uploading ? 'Yükleniyor...' : 'Fotoğraf Yükle'}
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
            multiple
            className="sr-only"
            onChange={(e) => handleFiles(e.target.files)}
            disabled={isBlocked}
          />
        </label>

        <div className="flex items-center gap-3">
          {dirty && !isBlocked && (
            <span className="text-xs font-medium text-[#e8bf4d]">Kaydedilmemiş değişiklikler</span>
          )}
          <Button
            size="sm"
            onClick={async () => {
              if (await persistGallery(items)) {
                setDirty(false)
                await onChanged()
              }
            }}
            disabled={!dirty || isBlocked}
            className="cursor-pointer"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            Galeriyi Kaydet
          </Button>
        </div>
      </div>
      <p className="-mt-2 text-xs text-muted-foreground">
        PNG/JPG/WEBP/GIF/AVIF · Maks 3.5MB · Sürükle-bırak yerine bu düğmeyi kullanabilirsin.
      </p>

      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border py-16 text-center text-muted-foreground">
          Henüz fotoğraf yok. Yukarıdan yükleyip “Galeriyi Kaydet”e bas.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((item) => (
            <figure key={item.id} className="overflow-hidden rounded-lg border border-border bg-card/60">
              <img
                src={item.url}
                alt={item.caption || 'Galeri fotoğrafı'}
                loading="lazy"
                className="aspect-[4/3] w-full object-cover"
              />
              <figcaption className="flex flex-col gap-2 p-3">
                <Input
                  value={item.caption ?? ''}
                  onChange={(e) => update(item.id, { caption: e.target.value })}
                  placeholder="Açıklama (isteğe bağlı)"
                  className="h-8 text-xs"
                  disabled={isBlocked}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemove(item)}
                  disabled={isBlocked}
                  className="cursor-pointer self-start text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  Kaldır
                </Button>
              </figcaption>
            </figure>
          ))}
        </div>
      )}
    </div>
  )
}
