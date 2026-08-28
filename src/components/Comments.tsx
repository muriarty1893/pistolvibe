import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { MessageSquare, Send } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { SectionHeading } from '@/components/SectionHeading'
import { RollingText } from '@/components/RollingText'
import { Reveal } from '@/components/Reveal'

interface Comment {
  id: string
  name: string
  pistol: string
  message: string
  createdAt: string
}

const commentSchema = z.object({
  name: z.string().min(2, 'Adın en az 2 karakter olmalı.'),
  pistol: z.string().min(2, 'Tabanca adı en az 2 karakter olmalı.'),
  message: z.string().min(5, 'Yorumun en az 5 karakter olmalı.'),
})

type CommentValues = z.infer<typeof commentSchema>

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function Comments() {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)

  const form = useForm<CommentValues>({
    resolver: zodResolver(commentSchema),
    defaultValues: { name: '', pistol: '', message: '' },
  })

  useEffect(() => {
    fetch('/api/comments')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setComments(Array.isArray(data) ? data : []))
      .catch(() => setComments([]))
      .finally(() => setLoading(false))
  }, [])

  async function onSubmit(values: CommentValues) {
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || 'Bir hata oluştu.')
      }
      const saved: Comment = await res.json()
      setComments((prev) => [saved, ...prev])
      toast.success('Yorumun paylaşıldı!', { description: 'Tabanca muhabbetine katıldığın için sağ ol.' })
      form.reset()
    } catch (err) {
      toast.error('Gönderilemedi', {
        description: err instanceof Error ? err.message : 'Bir hata oluştu.',
      })
    }
  }

  return (
    <section id="topluluk" className="scroll-mt-24 border-t border-border bg-card/30 py-24">
      <div className="container mx-auto px-6">
        <SectionHeading
          badge="Topluluk"
          title="Tabanca Muhabbeti"
          description="Hangi tabancayı beğendin? Deneyimini ve bildiğin bilgileri paylaş, topluluk öğrensin."
        />

        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 lg:grid-cols-5">
          <Reveal className="lg:col-span-2">
            <Card className="stamp-frame rounded-md bg-card">
              <CardContent className="p-6">
                <p className="stencil-label mb-4 text-muted-foreground/60" aria-hidden="true">
                  Saha Raporu — BR-116
                </p>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Adın *</FormLabel>
                          <FormControl>
                            <Input placeholder="Adın veya lakabın" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="pistol"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Beğendiğin Tabanca *</FormLabel>
                          <FormControl>
                            <Input placeholder="ör. Novritsch SSP-5" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Yorumun *</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Bu tabanca hakkında ne düşünüyorsun? Deneyimlerini anlat..."
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" disabled={form.formState.isSubmitting}>
                      <Send className="h-4 w-4" aria-hidden="true" />
                      <RollingText
                        text={form.formState.isSubmitting ? 'Gönderiliyor...' : 'Yorumu Paylaş'}
                      />
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </Reveal>

          <div className="lg:col-span-3">
            {loading ? (
              <p className="py-12 text-center text-muted-foreground">Yorumlar yükleniyor...</p>
            ) : comments.length === 0 ? (
              <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed border-border py-16 text-muted-foreground">
                <MessageSquare className="h-10 w-10 opacity-40" aria-hidden="true" />
                <p className="text-sm">Henüz yorum yok. İlk yorumu sen yap!</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {comments.map((comment, i) => (
                  <Reveal key={comment.id} delay={Math.min(i * 80, 400)}>
                    <Card className="rounded-md border-l-2 border-l-primary/40 bg-card transition-colors duration-200 hover:border-primary/40">
                      <CardContent className="p-5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-display text-sm uppercase tracking-wider text-foreground">
                            {comment.name}
                          </p>
                          <Badge variant="outline" className="text-[10px] uppercase tracking-widest">
                            {comment.pistol}
                          </Badge>
                        </div>
                        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                          {comment.message}
                        </p>
                        <p className="stencil-label mt-3 text-[10px] text-muted-foreground/60">
                          Kayıt: {formatDate(comment.createdAt)}
                        </p>
                      </CardContent>
                    </Card>
                  </Reveal>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
