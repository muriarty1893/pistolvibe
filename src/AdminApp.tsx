import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { FileText, Lock, LogOut, MessageSquare, RefreshCw, Trash2 } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface Application {
  id: string
  name: string
  callsign: string
  age: number | null
  email: string
  phone: string
  pistol: string
  experience: string
  message: string
  createdAt: string
}

interface Comment {
  id: string
  name: string
  pistol: string
  message: string
  createdAt: string
}

const STORAGE_KEY = 'pistolvibe-admin-key'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function AdminApp() {
  const [adminKey, setAdminKey] = useState('')
  const [authed, setAuthed] = useState(false)
  const [passwordInput, setPasswordInput] = useState('')
  const [data, setData] = useState<{ comments: Comment[]; applications: Application[] } | null>(null)
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState<'applications' | 'comments'>('applications')

  const load = useCallback(async (key: string): Promise<boolean> => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin', { headers: { 'x-admin-key': key } })
      const body = await res.json().catch(() => null)
      if (!res.ok) throw new Error(body?.error || 'Bir hata oluştu.')
      setData(body)
      return true
    } catch (err) {
      toast.error('Yüklenemedi', {
        description: err instanceof Error ? err.message : 'Bir hata oluştu.',
      })
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const saved = sessionStorage.getItem(STORAGE_KEY)
    if (saved) {
      setAdminKey(saved)
      load(saved).then((ok) => {
        if (ok) setAuthed(true)
        else sessionStorage.removeItem(STORAGE_KEY)
      })
    }
  }, [load])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    const ok = await load(passwordInput)
    if (ok) {
      sessionStorage.setItem(STORAGE_KEY, passwordInput)
      setAdminKey(passwordInput)
      setAuthed(true)
      setPasswordInput('')
    }
  }

  function handleLogout() {
    sessionStorage.removeItem(STORAGE_KEY)
    setAdminKey('')
    setAuthed(false)
    setData(null)
  }

  async function handleDelete(type: 'comment' | 'application', id: string) {
    if (!window.confirm('Bu kaydı silmek istediğine emin misin?')) return
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
        body: JSON.stringify({ type, id }),
      })
      const body = await res.json().catch(() => null)
      if (!res.ok) throw new Error(body?.error || 'Bir hata oluştu.')
      toast.success('Kayıt silindi')
      await load(adminKey)
    } catch (err) {
      toast.error('Silinemedi', {
        description: err instanceof Error ? err.message : 'Bir hata oluştu.',
      })
    }
  }

  if (!authed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-grid px-6">
        <Card className="w-full max-w-sm border-border bg-card/80">
          <CardContent className="p-8">
            <div className="mb-6 flex flex-col items-center gap-3 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-primary/40 bg-primary/10">
                <Lock className="h-6 w-6 text-primary" aria-hidden="true" />
              </div>
              <h1 className="font-display text-xl uppercase tracking-wide">
                Pistol <span className="text-gold-gradient">Vibe</span> Admin
              </h1>
              <p className="text-sm text-muted-foreground">Devam etmek için şifreyi gir.</p>
            </div>
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <Input
                type="password"
                placeholder="Admin şifresi"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                autoFocus
              />
              <Button type="submit" disabled={loading || !passwordInput}>
                {loading ? 'Kontrol ediliyor...' : 'Giriş Yap'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  const applications = data?.applications ?? []
  const comments = data?.comments ?? []

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50">
        <div className="container mx-auto flex flex-wrap items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-3">
            <img src="/assets/logo-nobg.png" alt="Pistol Vibe" className="h-9 w-9 gold-glow-sm" />
            <span className="font-display text-sm uppercase tracking-widest">
              Pistol <span className="text-gold-gradient">Vibe</span> Admin
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => load(adminKey)} disabled={loading}>
              <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} aria-hidden="true" />
              Yenile
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Çıkış
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="mb-6 flex flex-wrap gap-2">
          <Button
            variant={tab === 'applications' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTab('applications')}
          >
            <FileText className="h-4 w-4" aria-hidden="true" />
            Başvurular ({applications.length})
          </Button>
          <Button
            variant={tab === 'comments' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTab('comments')}
          >
            <MessageSquare className="h-4 w-4" aria-hidden="true" />
            Yorumlar ({comments.length})
          </Button>
        </div>

        {loading && !data ? (
          <p className="py-16 text-center text-muted-foreground">Yükleniyor...</p>
        ) : tab === 'applications' ? (
          applications.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border py-16 text-center text-muted-foreground">
              Henüz başvuru yok.
            </p>
          ) : (
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
                  {applications.map((app) => (
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
                      <td className="px-4 py-3">
                        <Badge variant="outline">{app.experience}</Badge>
                      </td>
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
                          onClick={() => handleDelete('application', app.id)}
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
        ) : comments.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border py-16 text-center text-muted-foreground">
            Henüz yorum yok.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {comments.map((comment) => (
              <Card key={comment.id} className="border-border bg-card/80">
                <CardContent className="flex items-start justify-between gap-4 p-5">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-display text-sm uppercase tracking-wider">{comment.name}</p>
                      <Badge variant="outline">{comment.pistol}</Badge>
                      <span className="text-xs text-muted-foreground/60">
                        {formatDate(comment.createdAt)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {comment.message}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => handleDelete('comment', comment.id)}
                    aria-label={`${comment.name} yorumunu sil`}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
