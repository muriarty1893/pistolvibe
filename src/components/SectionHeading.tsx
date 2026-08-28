import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Reveal } from '@/components/Reveal'
import { cn } from '@/lib/utils'

interface SectionHeadingProps {
  badge: string
  title: string
  description?: string
  /** Koyu "gece bandı" üzerinde kullanılır — metinler bant rengine göre boyanır */
  inverted?: boolean
}

export function SectionHeading({ badge, title, description, inverted = false }: SectionHeadingProps) {
  return (
    <Reveal
      className={cn(
        'mx-auto mb-12 max-w-2xl text-center',
        inverted && 'text-band-foreground'
      )}
    >
      <Badge
        variant="outline"
        className={cn(inverted && 'border-band-foreground/30 bg-transparent text-band-foreground/70')}
      >
        {badge}
      </Badge>
      <h2
        className={cn(
          'font-display text-3xl uppercase tracking-wide sm:text-4xl lg:text-5xl',
          inverted ? 'text-band-foreground' : 'text-foreground'
        )}
      >
        {title}
      </h2>
      <Separator className={cn('mx-auto mt-6 w-24', inverted ? 'bg-brass-pop/60' : 'bg-primary/60')} />
      {description && (
        <p className={cn('mt-6 text-base', inverted ? 'text-band-foreground/70' : 'text-muted-foreground')}>
          {description}
        </p>
      )}
    </Reveal>
  )
}
