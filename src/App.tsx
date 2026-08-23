import { Navbar } from '@/components/Navbar'
import { Hero } from '@/components/Hero'
import { ApplicationForm } from '@/components/ApplicationForm'
import { Gallery } from '@/components/Gallery'
import { Sponsors } from '@/components/Sponsors'
import { Comments } from '@/components/Comments'
import { Footer } from '@/components/Footer'
import { Toaster } from 'sonner'

export default function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main>
        <Hero />
        <ApplicationForm />
        <Gallery />
        <Sponsors />
        <Comments />
      </main>
      <Footer />
      <Toaster theme="dark" richColors position="top-center" />
    </div>
  )
}
