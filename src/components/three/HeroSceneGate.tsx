import { Component, Suspense, lazy, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { DualPistolViewer } from '@/components/three/PistolViewer'

const CinematicHeroScene = lazy(() =>
  import('@/components/three/CinematicHeroScene').then((m) => ({ default: m.CinematicHeroScene }))
)

export { CinematicHeroScene }

function webglSupported(): boolean {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}

class Gate extends Component<
  { children: ReactNode; fallback: ReactNode; onError: () => void },
  { failed: boolean }
> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch(err: unknown) {
    console.warn('[hero] sahne katmanı düşürüldü:', err)
    this.props.onError()
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}

/** eski nesil hero: süzülen iki tabanca (DualPistolViewer) — sinematik sahne düşerse devreye girer */
function LegacyHeroGuns() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    const id = window.setTimeout(() => setMounted(true), 300)
    return () => window.clearTimeout(id)
  }, [])
  if (!mounted) return null
  return (
    <div className="absolute inset-0" aria-hidden="true">
      <Suspense fallback={null}>
        <DualPistolViewer
          className="absolute inset-0"
          guns={[
            { url: '/models/colt_m1911.glb', muzzle: -1, size: 1.55, position: [-1.75, -0.7, 0], spin: 0.32, phase: 0, tilt: -0.5 },
            { url: '/models/9mm_pistol.glb', muzzle: -1, size: 1.55, position: [1.75, -0.7, 0], spin: -0.32, phase: 2.1, tilt: 0.5 },
          ]}
        />
      </Suspense>
    </div>
  )
}

export interface HeroSceneGateProps {
  children: ReactNode
  /** son katman: hiçbir 3B çalışmazsa (arka plan bloğu) */
  fallback: ReactNode
  /** 3B tamamen kullanılamaz olduğunda haber ver (statik CTA göster) */
  onUnavailable?: () => void
}

/**
 * Kademeli 3B stratejisi:
 *  1) sinematik sahne (colt_1911 + glock, scroll scrub)
 *  2) patlarsa -> eski hero (süzülen tabancalar, DualPistolViewer)
 *  3) o da patlarsa -> düz arka plan bloğu (kopya + CTA zaten DOM'da)
 */
export function HeroSceneGate({ children, fallback, onUnavailable }: HeroSceneGateProps) {
  const [glOk, setGlOk] = useState<boolean | null>(null)
  const [sceneFailed, setSceneFailed] = useState(false)
  const [legacyFailed, setLegacyFailed] = useState(false)

  useEffect(() => {
    const ok = webglSupported()
    setGlOk(ok)
    if (!ok) onUnavailable?.()
  }, [onUnavailable])

  if (glOk === null) return null

  if (glOk === false || legacyFailed) return <>{fallback}</>

  if (sceneFailed) {
    // katman 2: eski hero — o da patlarsa Gate son katmana düşer
    return (
      <Gate onError={() => setLegacyFailed(true)} fallback={fallback}>
        <LegacyHeroGuns />
      </Gate>
    )
  }

  return (
    <Gate
      onError={() => {
        setSceneFailed(true)
        onUnavailable?.()
      }}
      fallback={<LegacyHeroGuns />}
    >
      <Suspense fallback={null}>{children}</Suspense>
    </Gate>
  )
}
