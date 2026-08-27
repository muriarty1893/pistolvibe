import { Component, Suspense, lazy, useEffect, useState } from 'react'
import type { ReactNode } from 'react'

const CinematicHeroScene = lazy(() =>
  import('@/components/three/CinematicHeroScene').then((m) => ({ default: m.CinematicHeroScene }))
)

function webglSupported(): boolean {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}

class SceneBoundary extends Component<{ children: ReactNode; onError: () => void }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch(err: unknown) {
    console.warn('3B sahne yüklenemedi, statik hero gösteriliyor:', err)
    this.props.onError()
  }
  render() {
    return this.state.failed ? null : this.props.children
  }
}

export interface HeroSceneGateProps {
  /** WebGL hazırsa 3B sahne; değilse statik fallback */
  children: ReactNode
  fallback: ReactNode
  /** sahne kullanılamadığında ana bileşene haber ver (statik CTA göster etc.) */
  onUnavailable?: () => void
}

/** 3B sahneyi korur: WebGL yoksa / chunk patlarsa sayfa asla boş kalmaz */
export function HeroSceneGate({ children, fallback, onUnavailable }: HeroSceneGateProps) {
  const [glOk, setGlOk] = useState<boolean | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const ok = webglSupported()
    setGlOk(ok)
    if (!ok) onUnavailable?.()
  }, [onUnavailable])

  if (glOk === null) return null // ilk boyamada kısa bekleme — DOM zaten kopyayı gösterir
  if (glOk === false || failed) return <>{fallback}</>

  return (
    <SceneBoundary onError={() => { setFailed(true); onUnavailable?.() }}>
      <Suspense fallback={null}>{children}</Suspense>
    </SceneBoundary>
  )
}

export { CinematicHeroScene }
