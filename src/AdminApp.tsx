import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  Camera,
  CalendarDays,
  Crosshair,
  FileText,
  Lock,
  LogOut,
  MessageSquare,
  RefreshCw,
  Trophy,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

import {
  fetchAdminData,
  type AdminData,
} from '@/admin/shared'
import { ApplicationsTab } from '@/admin/ApplicationsTab'
import { CommentsTab } from '@/admin/CommentsTab'
import { ScoresTab } from '@/admin/ScoresTab'
import { GalleryTab } from '@/admin/GalleryTab'
import { StatsTab } from '@/admin/StatsTab'
import { ArsenalTab } from '@/admin/ArsenalTab'
import { EventsTab } from '@/admin/EventsTab'

const STORAGE_KEY = 'pistolvibe-admin-key'

export type AdminTab =
  | 'applications'
  | 'comments'
  | 'scores'
  | 'gallery'
  | 'stats'
  | 'arsenal'
  | 'events'

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
  const [authed, setAuthed] = useState(false)
  const [passwordInput, setPasswordInput] = useState('')
  const [data, setData] = useState<AdminData | null>(null)
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState<AdminTab>('applications')

  // Son admin şifresi — sekmeye prop olarak geçilir
  const [adminKey, setAdminKey] = useState('')

  const load = useCallback(async (key: string): Promise<boolean> => {
    setLoading(true)
    try {
      const data = await fetchAdminData(key)
      setData(data)
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
    if (await load(passwordInput)) {
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

  /** Veri değiştiğinde (kayıt/silme sonrası) listeyi tazeler. */
  const refresh = useCallback(() => load(adminKey), [load, adminKey])

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
                Pistol <span className="text-[#e8bf4d]">Vibe</span> Admin
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

  const TABS: Array<{ id: AdminTab; label: string; icon: typeof FileText; count?: number }> = [
    { id: 'applications', label: 'Başvurular', icon: FileText, count: applications.length },
    { id: 'comments', label: 'Yorumlar', icon: MessageSquare, count: comments.length },
    { id: 'scores', label: 'Skorlar', icon: Trophy },
    { id: 'gallery', label: 'Galeri', icon: Camera },
    { id: 'stats', label: 'İstatistikler', icon: RefreshCw },
    { id: 'arsenal', label: 'Cephanelik', icon: Crosshair },
    { id: 'events', label: 'Etkinlikler', icon: CalendarDays },
  ]

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50">
        <div className="container mx-auto flex flex-wrap items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-3">
            <img src="/assets/logo-nobg.png" alt="Pistol Vibe" className="h-9 w-9 gold-glow-sm" />
            <span className="font-display text-sm uppercase tracking-widest">
              Pistol <span className="text-[#e8bf4d]">Vibe</span> Admin
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => refresh()} disabled={loading}>
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
          {TABS.map(({ id, label, icon: Icon, count }) => (
            <Button
              key={id}
              variant={tab === id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTab(id)}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {label}
              {typeof count === 'number' && (
                <Badge variant="outline" className="ml-1 px-1.5 py-0 text-xs">
                  {count}
                </Badge>
              )}
            </Button>
          ))}
        </div>

        {!data ? (
          <p className="py-16 text-center text-muted-foreground">Yükleniyor...</p>
        ) : (
          <>
            {tab === 'applications' && (
              <ApplicationsTab data={data} adminKey={adminKey} onChanged={refresh} formatDate={formatDate} />
            )}
            {tab === 'comments' && (
              <CommentsTab data={data} adminKey={adminKey} onChanged={refresh} formatDate={formatDate} />
            )}
            {tab === 'scores' && (
              <ScoresTab data={data} adminKey={adminKey} onChanged={refresh} />
            )}
            {tab === 'gallery' && (
              <GalleryTab data={data} adminKey={adminKey} onChanged={refresh} />
            )}
            {tab === 'stats' && <StatsTab data={data} adminKey={adminKey} />}
            {tab === 'arsenal' && <ArsenalTab data={data} adminKey={adminKey} />}
            {tab === 'events' && <EventsTab data={data} adminKey={adminKey} />}
          </>
        )}
      </main>
    </div>
  )
}

// Küçük tekrar kullanılabilir parçalar

export function TabEmptyState({ message }: { message: string }) {
  return (
    <p className="rounded-lg border border-dashed border-border py-16 text-center text-muted-foreground">
      {message}
    </p>
  )
}
