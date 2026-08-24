import { Separator } from '@/components/ui/separator'

export function Footer() {
  return (
    <footer className="border-t border-border py-12">
      <div className="container mx-auto flex flex-col items-center gap-6 px-6 text-center">
        <img src="/assets/logo-nobg.png" alt="Pistol Vibe logosu" className="h-14 w-14 gold-glow-sm" />
        <div>
          <p className="font-display text-lg uppercase tracking-wide">
            Pistol <span className="text-gold-gradient">Vibe</span>
          </p>
          <p className="mt-1 text-xs uppercase tracking-[0.3em] text-muted-foreground">
            Sadece Tabanca
          </p>
        </div>
        <Separator className="w-24" />
        <p className="max-w-md text-sm text-muted-foreground">
          Airsoft bir spordur. Saha ve güvenlik kurallarına her zaman uyarız; koruyucu gözlük
          olmadan asla oyuna girmeyiz.
        </p>
        <p className="text-xs text-muted-foreground/60">
          © {new Date().getFullYear()} Pistol Vibe. Tüm hakları saklıdır.
        </p>
      </div>
    </footer>
  )
}
