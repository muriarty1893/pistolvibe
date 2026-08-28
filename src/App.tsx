import { Navbar } from '@/components/Navbar'
import { Hero } from '@/components/Hero'
import { StatsStrip } from '@/components/StatsStrip'
import { Arsenal } from '@/components/Arsenal'
import { RangeGame } from '@/components/RangeGame'
import { Leaderboard } from '@/components/Leaderboard'
import { ApplicationForm } from '@/components/ApplicationForm'
import { Gallery } from '@/components/Gallery'
import { Events } from '@/components/Events'
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
        <StatsStrip />
        <Arsenal />
        <RangeGame />
        <Leaderboard />
        <ApplicationForm />
        <Gallery />
        <Events />
        <Sponsors />
        <Comments />
      </main>
      <Footer />
      <Toaster theme="light" richColors position="top-center" />
    </div>
  )
}
