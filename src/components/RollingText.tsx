import { cn } from '@/lib/utils'

// Obsidian koleksiyonundaki TextRoll bileşeninin bağımlılıksız (saf CSS) uyarlaması.
// Üst öğede "group/btn" sınıfı varsa hover'da harfler yukarı kayar ve alttan yenisi gelir.
const STAGGER_MS = 28

interface RollingTextProps {
  text: string
  className?: string
  center?: boolean
}

export function RollingText({ text, className, center = true }: RollingTextProps) {
  const delayFor = (i: number) =>
    center ? STAGGER_MS * Math.abs(i - (text.length - 1) / 2) : STAGGER_MS * i

  const renderCopy = (hidden: boolean) => (
    <span className={hidden ? 'absolute inset-0' : 'block'} aria-hidden={hidden || undefined}>
      {text.split('').map((ch, i) => (
        <span
          key={i}
          className={cn(
            'inline-block transition-transform duration-300 ease-in-out',
            hidden
              ? 'translate-y-full group-hover/btn:translate-y-0'
              : 'group-hover/btn:-translate-y-full'
          )}
          style={{ transitionDelay: `${delayFor(i)}ms` }}
        >
          {ch === ' ' ? ' ' : ch}
        </span>
      ))}
    </span>
  )

  return (
    <span className={cn('rolling-text relative block overflow-hidden leading-[1.1]', className)}>
      {renderCopy(false)}
      {renderCopy(true)}
    </span>
  )
}
