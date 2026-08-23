import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Send } from 'lucide-react'

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { SectionHeading } from '@/components/SectionHeading'
import { RollingText } from '@/components/RollingText'
import { Reveal } from '@/components/Reveal'

const applicationSchema = z.object({
  name: z.string().min(2, 'Adın en az 2 karakter olmalı.'),
  callsign: z.string().min(2, 'Çağrı adın en az 2 karakter olmalı.'),
  age: z.coerce
    .number({ invalid_type_error: 'Geçerli bir yaş gir.' })
    .min(14, 'En az 14 yaşında olmalısın.')
    .max(99, 'Geçerli bir yaş gir.'),
  email: z.string().email('Geçerli bir e-posta adresi gir.'),
  phone: z.string().optional(),
  pistol: z.string().optional(),
  experience: z.string().min(1, 'Deneyim seviyeni seç.'),
  message: z.string().optional(),
})

type ApplicationValues = z.infer<typeof applicationSchema>

const EXPERIENCE_LEVELS = ['Yeni Başlayan', 'Orta Seviye', 'Deneyimli', 'Veteran']

export function ApplicationForm() {
  const form = useForm<ApplicationValues>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      name: '',
      callsign: '',
      age: undefined,
      email: '',
      phone: '',
      pistol: '',
      experience: '',
      message: '',
    },
  })

  async function onSubmit(values: ApplicationValues) {
    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || 'Bir hata oluştu.')
      }
      toast.success('Başvurun alındı!', {
        description: 'En kısa sürede sana dönüş yapacağız. Sahada görüşürüz.',
      })
      form.reset()
    } catch (err) {
      toast.error('Gönderilemedi', {
        description: err instanceof Error ? err.message : 'Bir hata oluştu.',
      })
    }
  }

  return (
    <section id="basvuru" className="scroll-mt-24 py-24">
      <div className="container mx-auto px-6">
        <SectionHeading
          badge="Başvuru"
          title="Ekibe Katıl"
          description="Formu doldur, seni deneme oyununa davet edelim. Tek şart: tabancan ve fair play ruhu."
        />

        <Reveal>
          <Card className="mx-auto max-w-2xl border-border bg-card/80">
            <CardContent className="p-6 sm:p-8">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ad Soyad *</FormLabel>
                        <FormControl>
                          <Input placeholder="Adın ve soyadın" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="callsign"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Çağrı Adı *</FormLabel>
                        <FormControl>
                          <Input placeholder="Sahadaki lakabın" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="age"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Yaş *</FormLabel>
                        <FormControl>
                          <Input type="number" min={14} max={99} placeholder="18" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>E-posta *</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="ornek@mail.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefon (isteğe bağlı)</FormLabel>
                        <FormControl>
                          <Input type="tel" placeholder="05xx xxx xx xx" {...field} />
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
                        <FormLabel>Sahip Olduğun Tabanca (isteğe bağlı)</FormLabel>
                        <FormControl>
                          <Input placeholder="ör. Glock 18C, Hi-Capa 5.1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="experience"
                    render={({ field }) => (
                      <FormItem className="sm:col-span-2">
                        <FormLabel>Deneyim Seviyesi *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seviyeni seç" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {EXPERIENCE_LEVELS.map((level) => (
                              <SelectItem key={level} value={level}>
                                {level}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem className="sm:col-span-2">
                        <FormLabel>Neden aramıza katılmak istiyorsun? (isteğe bağlı)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Kısaca kendinden ve airsoft geçmişinden bahset..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="sm:col-span-2">
                    <Button type="submit" size="lg" className="w-full" disabled={form.formState.isSubmitting}>
                      <Send className="h-4 w-4" aria-hidden="true" />
                      <RollingText
                        text={form.formState.isSubmitting ? 'Gönderiliyor...' : 'Başvuruyu Gönder'}
                      />
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </Reveal>
      </div>
    </section>
  )
}
