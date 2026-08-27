import { Suspense, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { clone as skeletonClone } from 'three/addons/utils/SkeletonUtils.js'
import * as THREE from 'three'

export interface CinematicHeroSceneProps {
  /** 0..1 — GSAP ScrollTrigger scrub'dan beslenen film ilerlemesi */
  progressRef: { current: number }
  /** reduced-motion: sabit kamera, scrub yok */
  reduced: boolean
}

/** modeli normalize et: uzunluğu s, merkezdom origin, verilen yaw ile döndür */
function useNormalized(model: THREE.Group, targetLen: number, yaw: number) {
  return useMemo(() => {
    const box = new THREE.Box3().setFromObject(model)
    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())
    const k = targetLen / Math.max(size.x, size.y, size.z, 0.001)
    model.scale.setScalar(k)
    model.position.set(-center.x * k, -center.y * k, -center.z * k)
    const g = new THREE.Group()
    g.add(model)
    g.rotation.y = yaw
    return g
  }, [model, targetLen, yaw])
}

function GoldPool({ x, z, scale = 1.6 }: { x: number; z: number; scale?: number }) {
  const tex = useMemo(() => {
    const cv = document.createElement('canvas')
    cv.width = cv.height = 256
    const ctx = cv.getContext('2d')!
    const g = ctx.createRadialGradient(128, 128, 8, 128, 128, 126)
    g.addColorStop(0, 'rgba(212,175,55,0.55)')
    g.addColorStop(0.5, 'rgba(212,175,55,0.16)')
    g.addColorStop(1, 'rgba(212,175,55,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 256, 256)
    const t = new THREE.CanvasTexture(cv)
    t.colorSpace = THREE.SRGBColorSpace
    return t
  }, [])
  return (
    <mesh position={[x, 0.005, z]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[scale, scale]} />
      <meshBasicMaterial map={tex} transparent depthWrite={false} />
    </mesh>
  )
}

function Pistols({ progressRef, reduced }: { progressRef: { current: number }; reduced: boolean }) {
  const glock = useGLTF('/models/9mm_pistol.glb')
  const colt = useGLTF('/models/colt_1911.glb')

  // skinned mesh: düz .clone(true) iskelet bağını kırar — SkeletonUtils gerekli
  const glockClone = useMemo(() => skeletonClone(glock.scene) as THREE.Group, [glock.scene])
  const coltClone = useMemo(() => skeletonClone(colt.scene) as THREE.Group, [colt.scene])

  const glockGroup = useNormalized(glockClone, 1.15, THREE.MathUtils.degToRad(38))
  const coltPrepared = useMemo(() => {
    const box = new THREE.Box3().setFromObject(coltClone)
    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())
    const k = 1.3 / Math.max(size.x, size.y, size.z, 0.001)
    coltClone.scale.setScalar(k)
    coltClone.position.set(-center.x * k, -center.y * k, -center.z * k)
    const g = new THREE.Group()
    g.add(coltClone)
    return g
  }, [coltClone])

  const coltSpin = useRef<THREE.Group>(null)

  useFrame((state, delta) => {
    const p = reduced ? 0.45 : progressRef.current
    // kamera yolu: glock yakın -> orta geniş -> merkez geçidi -> colt yakın
    const t = reduced ? 0.5 : THREE.MathUtils.clamp((p - 0.14) / 0.72, 0, 1)
    const e = t * t * (3 - 2 * t) // smoothstep
    const glockPos = new THREE.Vector3(-0.95, 0.55, 0)
    const coltPos = new THREE.Vector3(0.95, 0.6, -0.35)
    const camCloseG = new THREE.Vector3(-1.35, 0.32, 1.15)
    const camWide = new THREE.Vector3(0, 0.85, 2.75)
    const camMid = new THREE.Vector3(0, 0.68, 1.55)
    const camCloseC = new THREE.Vector3(0.55, 0.55, 1.05)
    const a = new THREE.Vector3()
    const b = new THREE.Vector3()
    let cam: THREE.Vector3
    let look: THREE.Vector3
    if (e < 0.35) {
      const k = THREE.MathUtils.smoothstep(e / 0.35, 0, 1)
      cam = a.copy(camCloseG).lerp(camWide, k)
      look = b.copy(glockPos).lerp(new THREE.Vector3(0, 0.55, -0.1), k)
    } else if (e < 0.65) {
      const k = THREE.MathUtils.smoothstep((e - 0.35) / 0.3, 0, 1)
      cam = a.copy(camWide).lerp(camMid, k)
      look = b.lerpVectors(new THREE.Vector3(0, 0.55, -0.1), new THREE.Vector3(0.2, 0.55, -0.2), k)
    } else {
      const k = THREE.MathUtils.smoothstep((e - 0.65) / 0.35, 0, 1)
      cam = a.copy(camMid).lerp(camCloseC, k)
      look = b.copy(coltPos)
    }
    const camV = state.camera as THREE.PerspectiveCamera
    const w = reduced ? 0 : 0.07 * (1 - t * 0.7)
    camV.position.x = THREE.MathUtils.damp(camV.position.x, cam.x + state.pointer.x * w, 5, delta)
    camV.position.y = THREE.MathUtils.damp(camV.position.y, cam.y + state.pointer.y * w * 0.6, 5, delta)
    camV.position.z = THREE.MathUtils.damp(camV.position.z, cam.z, 5, delta)
    camV.lookAt(look)

    // colt turntable: scroll scrub'ına bağlı kendi ekseninde dönüş
    if (coltSpin.current) {
      const local = reduced ? 0.4 : THREE.MathUtils.clamp((p - 0.3) / 0.65, 0, 1)
      coltSpin.current.rotation.y = THREE.MathUtils.degToRad(-24) + local * 0.9
    }
  })

  return (
    <group>
      <group position={[-0.95, 0.55, 0]} rotation={[0.06, 0, 0.02]}>
        <primitive object={glockGroup} />
      </group>
      <group ref={coltSpin} position={[0.95, 0.6, -0.35]} rotation={[0.05, 0, -0.02]}>
        <primitive object={coltPrepared} />
      </group>
      {/* zemin: koyu, hafif speküler — kenar kareye girmez */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -2]}>
        <circleGeometry args={[30, 48]} />
        <meshStandardMaterial color="#0d0d12" roughness={0.32} metalness={0.65} />
      </mesh>
      {/* altın ışık havuzları */}
      <GoldPool x={-0.95} z={0} scale={2.1} />
      <GoldPool x={0.95} z={-0.35} scale={2.4} />
    </group>
  )
}

export function CinematicHeroScene({ progressRef, reduced }: CinematicHeroSceneProps) {
  return (
    <Canvas
      camera={{ fov: 42, position: [-1.35, 0.32, 1.15] }}
      dpr={[1, window.devicePixelRatio > 2 ? 1.75 : Math.min(window.devicePixelRatio, 2)]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = 1.1
      }}
      style={{ position: 'absolute', inset: 0 }}
    >
      {/* ışık: gerçek yönlü key + altın rim + düşük hemi — glow/post-process yok */}
      <directionalLight position={[2.6, 3.2, 2.2]} intensity={2.4} color="#fff2d8" />
      <directionalLight position={[-3, 1.7, -2.6]} intensity={3.2} color="#d4af37" />
      <hemisphereLight args={['#232330', '#050507', 0.7]} />
      <Suspense fallback={null}>
        <Pistols progressRef={progressRef} reduced={reduced} />
      </Suspense>
    </Canvas>
  )
}

useGLTF.preload('/models/9mm_pistol.glb')
