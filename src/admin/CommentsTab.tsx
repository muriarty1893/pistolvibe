import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import {
  runWithToast,
  updateComment,
  deleteCommentFromApi,
  type AdminData,
  type Comment,
} from '@/admin/shared'

interface Props {
  data: AdminData
  adminKey: string
  onChanged: () => unknown
  formatDate: (iso: string) => string
}

export function CommentsTab({ data, adminKey, onChanged, formatDate }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState<Pick<Comment, 'name' | 'pistol' | 'message'>>({
    name: '',
    pistol: '',
    message: '',
  })
  const [saving, setSaving] = useState(false)

  function startEdit(comment: Comment) {
    setEditingId(comment.id)
    setDraft({ name: comment.name, pistol: comment.pistol, message: comment.message })
  }

  async function saveEdit(id: string) {
    if (!draft.name.trim() || !draft.pistol.trim() || !draft.message.trim()) {
      toast.error('Tüm alanlar zorunlu.')
      return
    }
    setSaving(true)
    const ok = await runWithToast(() => updateComment(adminKey, { id, ...draft }), 'Yorum güncellendi')
    setSaving(false)
    if (ok) {
      setEditingId(null)
      await onChanged()
    }
  }

  async function handleDelete(comment: Comment) {
    if (!window.confirm(`${comment.name} yorumunu silmek istediğine emin misin?`)) return
    const ok = await runWithToast(() => deleteCommentFromApi(adminKey, comment.id), 'Yorum silindi')
    if (ok) await onChanged()
  }

  const comments = data.comments

  if (comments.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border py-16 text-center text-muted-foreground">
        Henüz yorum yok.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {comments.map((comment) =>
        editingId === comment.id ? (
          <div key={comment.id} className="rounded-lg border border-primary/50 bg-card/80 p-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                placeholder="İsim"
              />
              <Input
                value={draft.pistol}
                onChange={(e) => setDraft({ ...draft, pistol: e.target.value })}
                placeholder="Tabanca"
              />
            </div>
            <Textarea
              value={draft.message}
              onChange={(e) => setDraft({ ...draft, message: e.target.value })}
              placeholder="Yorum"
              rows={3}
              className="mt-3"
            />
            <div className="mt-3 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditingId(null)} disabled={saving}>
                İptal
              </Button>
              <Button size="sm" onClick={() => saveEdit(comment.id)} disabled={saving}>
                Kaydet
              </Button>
            </div>
          </div>
        ) : (
          <div key={comment.id} className="flex items-start justify-between gap-4 rounded-lg border border-border bg-card/80 p-5 transition-colors duration-150 hover:bg-card">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-display text-sm uppercase tracking-wider">{comment.name}</p>
                <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
                  {comment.pistol}
                </span>
                <span className="text-xs text-muted-foreground/60">{formatDate(comment.createdAt)}</span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{comment.message}</p>
            </div>
            <div className="flex shrink-0 gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => startEdit(comment)}
                aria-label={`${comment.name} yorumunu düzenle`}
              >
                <Pencil className="h-4 w-4" aria-hidden="true" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => handleDelete(comment)}
                aria-label={`${comment.name} yorumunu sil`}
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          </div>
        )
      )}
    </div>
  )
}
