import { useEffect, useState } from 'react'
import { Menu, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { RollingText } from '@/components/RollingText'
import { cn } from '@/lib/utils'

const LINKS = [
  { href: '#basvuru', label: 'Başvuru' },
  { href: '#galeri', label: 'Galeri' },
  { href: '#sponsorlar', label: 'Sponsorlar' },
  { href: '#topluluk', label: 'Topluluk' },
]

export function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className="fixed inset-x-4 top-4 z-50">
      <nav
        className={cn(
          'mx-auto flex max-w-6xl items-center justify-between rounded-lg border px-4 py-3 transition-colors duration-300',
          scrolled
            ? 'border-border bg-background/90 shadow-lg shadow-black/40 backdrop-blur-md'
            : 'border-transparent bg-transparent'
        )}
        aria-label="Ana gezinme"
      >
        <a href="#anasayfa" className="flex cursor-pointer items-center gap-3">
          <img src="/assets/logo-nobg.png" alt="Pistol Vibe logosu" className="h-10 w-10 gold-glow-sm" />
          <span className="font-display text-sm uppercase tracking-widest text-foreground sm:text-base">
            Adana <span className="text-gold-gradient">Tactical</span>
          </span>
        </a>

        <div className="hidden items-center gap-6 md:flex">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="cursor-pointer text-sm font-medium uppercase tracking-wider text-muted-foreground transition-colors duration-200 hover:text-primary"
            >
              {link.label}
            </a>
          ))}
          <Button asChild size="sm">
            <a href="#basvuru">
              <RollingText text="Bize Katıl" />
            </a>
          </Button>
        </div>

        <button
          type="button"
          className="cursor-pointer rounded-md p-2 text-foreground transition-colors duration-200 hover:bg-primary/10 hover:text-primary md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Menüyü kapat' : 'Menüyü aç'}
          aria-expanded={open}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {open && (
        <div className="mx-auto mt-2 max-w-6xl rounded-lg border border-border bg-background/95 p-4 shadow-lg shadow-black/40 backdrop-blur-md md:hidden">
          <div className="flex flex-col gap-1">
            {LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="cursor-pointer rounded-md px-3 py-2 text-sm font-medium uppercase tracking-wider text-muted-foreground transition-colors duration-200 hover:bg-primary/10 hover:text-primary"
              >
                {link.label}
              </a>
            ))}
            <Button asChild className="mt-2">
              <a href="#basvuru" onClick={() => setOpen(false)}>
                <RollingText text="Bize Katıl" />
              </a>
            </Button>
          </div>
        </div>
      )}
    </header>
  )
}
