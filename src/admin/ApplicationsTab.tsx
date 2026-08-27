import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  deleteApplication,
  runWithToast,
  type Application,
  type AdminData,
} from '@/admin/shared'

interface Props {
  data: AdminData
  adminKey: string
  onChanged: () => unknown
  formatDate: (iso: string) => string
}

export function ApplicationsTab({ data, adminKey, onChanged, formatDate }: Props) {
  const apps = data.applications

  async function handleDelete(app: Application) {
    if (!window.confirm(`${app.name} başvurusunu silmek istediğine emin misin?`)) return
    const ok = await runWithToast(() => deleteApplication(adminKey, app.id), 'Başvuru silindi')
    if (ok) await onChanged()
  }

  if (apps.length === 0) {
    return <p className="rounded-lg border border-dashed border-border py-16 text-center text-muted-foreground">Henüz başvuru yok.</p>
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-[900px] text-sm">
        <thead>
          <tr className="border-b border-border bg-card/60 text-left uppercase tracking-wider text-muted-foreground">
            <th className="px-4 py-3 font-medium">Ad</th>
            <th className="px-4 py-3 font-medium">Çağrı Adı</th>
            <th className="px-4 py-3 font-medium">Yaş</th>
            <th className="px-4 py-3 font-medium">İletişim</th>
            <th className="px-4 py-3 font-medium">Tabanca</th>
            <th className="px-4 py-3 font-medium">Deneyim</th>
            <th className="px-4 py-3 font-medium">Mesaj</th>
            <th className="px-4 py-3 font-medium">Tarih</th>
            <th className="px-4 py-3 font-medium"></th>
          </tr>
        </thead>
        <tbody>
          {apps.map((app) => (
            <tr key={app.id} className="border-b border-border/50 transition-colors duration-150 hover:bg-card/40">
              <td className="px-4 py-3 font-medium">{app.name}</td>
              <td className="px-4 py-3 text-muted-foreground">{app.callsign}</td>
              <td className="px-4 py-3">{app.age ?? '-'}</td>
              <td className="px-4 py-3">
                <div className="flex flex-col">
                  <a href={`mailto:${app.email}`} className="text-primary hover:underline">
                    {app.email}
                  </a>
                  {app.phone && <span className="text-muted-foreground">{app.phone}</span>}
                </div>
              </td>
              <td className="px-4 py-3">{app.pistol || '-'}</td>
              <td className="px-4 py-3">{app.experience}</td>
              <td className="max-w-[220px] px-4 py-3">
                <span className="block truncate text-muted-foreground" title={app.message}>
                  {app.message || '-'}
                </span>
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                {formatDate(app.createdAt)}
              </td>
              <td className="px-4 py-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => handleDelete(app)}
                  aria-label={`${app.name} başvurusunu sil`}
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
