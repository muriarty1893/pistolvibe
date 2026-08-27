import { useState } from 'react'
import { Plus, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import {
  addScore,
  deleteScore,
  updateScore,
  type AdminData,
  type ScoreRow,
} from '@/admin/shared'

interface Props {
  data: AdminData
  adminKey: string
  onChanged: () => unknown
}

interface Draft {
  callsign: string
  score: string
  accuracy: string
  bestStreak: string
}

const toDraft = (row: ScoreRow): Draft => ({
  callsign: row.callsign,
  score: String(row.score),
  accuracy: String(row.accuracy),
  bestStreak: String(row.bestStreak),
})

const EMPTY_DRAFT: Draft = { callsign: '', score: '', accuracy: '', bestStreak: '' }

function parseDraft(draft: Draft): Pick<ScoreRow, 'callsign' | 'score' | 'accuracy' | 'bestStreak'> | null {
  const callsign = draft.callsign.trim()
  const score = Math.floor(Number(draft.score))
  if (!callsign || callsign.length < 2 || !Number.isFinite(score) || score < 0 || score > 10000) {
    return null
  }
  return {
    callsign,
    score,
    accuracy: Math.min(100, Math.max(0, Math.floor(Number(draft.accuracy) || 0))),
    bestStreak: Math.min(999, Math.max(0, Math.floor(Number(draft.bestStreak) || 0))),
  }
}

export function ScoresTab({ data, adminKey, onChanged }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT)
  const [adding, setAdding] = useState(false)
  const [addDraft, setAddDraft] = useState<Draft>(EMPTY_DRAFT)
  const [busy, setBusy] = useState(false)

  const rows = [...data.scores].sort((a, b) => b.score - a.score)

  async function handleSaveEdit(id: string) {
    const parsed = parseDraft(draft)
    if (!parsed) {
      toast.error('Çağrı adı en az 2 karakter ve skor 0-10000 arasında olmalı.')
      return
    }
    setBusy(true)
    const ok = await updateScore(adminKey, { id, ...parsed })
      .then(() => true)
      .catch((err: Error) => {
        toast.error('Güncellenemedi', { description: err.message })
        return false
      })
      .finally(() => setBusy(false))
    if (ok) {
      setEditingId(null)
      await onChanged()
    }
  }

  async function handleDelete(row: ScoreRow) {
    if (!window.confirm(`${row.callsign} skorunu silmek istediğine emin misin?`)) return
    setBusy(true)
    const ok = await deleteScore(adminKey, row.id)
      .then(() => true)
      .catch((err: Error) => {
        toast.error('Silinemedi', { description: err.message })
        return false
      })
      .finally(() => setBusy(false))
    if (ok) {
      toast.success('Skor silindi')
      await onChanged()
    }
  }

  async function handleAdd() {
    const parsed = parseDraft(addDraft)
    if (!parsed) {
      toast.error('Çağrı adı en az 2 karakter ve skor 0-10000 arasında olmalı.')
      return
    }
    setBusy(true)
    const ok = await addScore(adminKey, parsed)
      .then(() => true)
      .catch((err: Error) => {
        toast.error('Eklenemedi', { description: err.message })
        return false
      })
      .finally(() => setBusy(false))
    if (ok) {
      toast.success('Skor eklendi')
      setAddDraft(EMPTY_DRAFT)
      setAdding(false)
      await onChanged()
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Yeni kayıt ekleme */}
      <div className="rounded-lg border border-border bg-card/60 p-4">
        {adding ? (
          <div className="grid gap-3 sm:grid-cols-[1fr_7rem_7rem_7rem_auto]">
            <Input
              autoFocus
              placeholder="Çağrı adı"
              value={addDraft.callsign}
              onChange={(e) => setAddDraft({ ...addDraft, callsign: e.target.value })}
            />
            <Input
              type="number"
              min={0}
              max={10000}
              placeholder="Skor"
              value={addDraft.score}
              onChange={(e) => setAddDraft({ ...addDraft, score: e.target.value })}
            />
            <Input
              type="number"
              min={0}
              max={100}
              placeholder="İsabet %"
              value={addDraft.accuracy}
              onChange={(e) => setAddDraft({ ...addDraft, accuracy: e.target.value })}
            />
            <Input
              type="number"
              min={0}
              max={999}
              placeholder="Seri"
              value={addDraft.bestStreak}
              onChange={(e) => setAddDraft({ ...addDraft, bestStreak: e.target.value })}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAdd} disabled={busy} className="cursor-pointer">
                <Plus className="h-4 w-4" aria-hidden="true" />
                Ekle
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setAdding(false)
                  setAddDraft(EMPTY_DRAFT)
                }}
                className="cursor-pointer"
                aria-label="Ekleme formunu kapat"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="outline" size="sm" onClick={() => setAdding(true)} className="cursor-pointer">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Manuel Skor Ekle
          </Button>
        )}
      </div>

      {/* Skor tablosu */}
      {rows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border py-16 text-center text-muted-foreground">
          Henüz skor yok.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border bg-card/60 text-left uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3 font-medium">#</th>
                <th className="px-4 py-3 font-medium">Çağrı Adı</th>
                <th className="px-4 py-3 text-right font-medium">Skor</th>
                <th className="px-4 py-3 text-right font-medium">İsabet</th>
                <th className="px-4 py-3 text-right font-medium">Seri</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) =>
                editingId === row.id ? (
                  <tr key={row.id} className="border-b border-border/50 bg-primary/5">
                    <td className="px-4 py-2 text-muted-foreground">{i + 1}</td>
                    <td className="px-4 py-2">
                      <Input
                        autoFocus
                        value={draft.callsign}
                        onChange={(e) => setDraft({ ...draft, callsign: e.target.value })}
                        className="h-8 w-full min-w-28"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <Input
                        type="number"
                        min={0}
                        max={10000}
                        value={draft.score}
                        onChange={(e) => setDraft({ ...draft, score: e.target.value })}
                        className="h-8 w-20 text-right"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={draft.accuracy}
                        onChange={(e) => setDraft({ ...draft, accuracy: e.target.value })}
                        className="h-8 w-20 text-right"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <Input
                        type="number"
                        min={0}
                        max={999}
                        value={draft.bestStreak}
                        onChange={(e) => setDraft({ ...draft, bestStreak: e.target.value })}
                        className="h-8 w-20 text-right"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSaveEdit(row.id)}
                          disabled={busy}
                          className="cursor-pointer"
                        >
                          Kaydet
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setEditingId(null)}
                          disabled={busy}
                          className="cursor-pointer"
                          aria-label="Düzenlemeyi iptal et"
                        >
                          <X className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr
                    key={row.id}
                    className={cn(
                      'border-b border-border/50 transition-colors duration-150 hover:bg-card/40',
                      i % 2 === 1 && 'bg-secondary/20'
                    )}
                  >
                    <td className="px-4 py-3 font-display text-muted-foreground">{i + 1}</td>
                    <td className="px-4 py-3 font-medium">{row.callsign}</td>
                    <td className="px-4 py-3 text-right font-display text-primary">
                      {row.score.toLocaleString('tr-TR')}
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{row.accuracy}%</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{row.bestStreak}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingId(row.id)
                            setDraft(toDraft(row))
                          }}
                          disabled={busy}
                          className="cursor-pointer"
                          aria-label={`${row.callsign} skorunu düzenle`}
                        >
                          Düzenle
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(row)}
                          disabled={busy}
                          className="cursor-pointer text-destructive hover:bg-destructive/10 hover:text-destructive"
                          aria-label={`${row.callsign} skorunu sil`}
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        Not: Tablo her sayfada en yüksek 10 skoru gösterir; buradaki tüm kayıtlar o listeye girer.
        Mobilde tabloyu yatay kaydırabilirsin.
      </p>
    </div>
  )
}
