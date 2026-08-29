import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Reveal } from '@/components/Reveal'

interface SectionHeadingProps {
  badge: string
  title: string
  description?: string
}

export function SectionHeading({ badge, title, description }: SectionHeadingProps) {
  return (
    <Reveal className="mx-auto mb-12 max-w-2xl text-center">
      <Badge variant="outline" className="mb-4">
        {badge}
      </Badge>
      <h2 className="font-display text-3xl uppercase tracking-wide text-foreground sm:text-4xl lg:text-5xl">
        {title}
      </h2>
      <Separator className="mx-auto mt-6 w-24 bg-primary/60" />
      {description && <p className="mt-6 text-base text-muted-foreground">{description}</p>}
    </Reveal>
  )
}
