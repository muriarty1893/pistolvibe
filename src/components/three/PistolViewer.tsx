import { Suspense, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF, Float, ContactShadows, Environment } from '@react-three/drei'
import { clone as skeletonClone } from 'three/addons/utils/SkeletonUtils.js'
import * as THREE from 'three'

export interface PistolMeshConfig {
  url: string
  /** Namlu yönü: 1 = +X, -1 = -X */
  muzzle?: 1 | -1
  /** GLB içindeki 'Fire' animasyonunu oynat */
  animated?: boolean
  /** Ateş sinyali: değer değişince bir atış tetiklenir */
  fireSignal?: { current: number }
  /** Mouse'u takip ederek nişan al (hero) */
  aim?: boolean
  /** Normalleştirilmiş model uzunluğu (world unit) */
  size?: number
}

const FLASH_DURATION = 0.09

export function usePistolModel(url: string, muzzle: 1 | -1, size: number) {
  const { scene, animations } = useGLTF(url)

  return useMemo(() => {
    const clone = skeletonClone(scene)
    const box = new THREE.Box3().setFromObject(clone)
    const dims = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())
    const maxDim = Math.max(dims.x, dims.y, dims.z) || 1
    const s = size / maxDim

    clone.traverse((child) => {
      const mesh = child as THREE.Mesh
      if (mesh.isMesh) {
        mesh.material = Array.isArray(mesh.material)
          ? mesh.material.map((m) => {
              const c = (m as THREE.MeshStandardMaterial).clone()
              if (c.color) c.color.convertSRGBToLinear()
              c.metalness = Math.max(c.metalness ?? 0.4, 0.55)
              c.roughness = Math.min(c.roughness ?? 0.5, 0.45)
              c.envMapIntensity = 1.35
              return c
            })
          : mesh.material
      }
    })

    const inner = new THREE.Group()
    inner.add(clone)
    inner.scale.setScalar(s)
    inner.position.set(-center.x * s, -center.y * s, -center.z * s)

    // Namlu ucu (normalize edilmiş uzayda)
    const muzzleX = muzzle === -1 ? box.min.x : box.max.x
    const muzzleTip = new THREE.Vector3(
      (muzzleX - center.x) * s,
      (-center.y + (box.max.y - 0.12) * 0.5) * s,
      0
    )

    let mixer: THREE.AnimationMixer | null = null
    let fireAction: THREE.AnimationAction | null = null
    if (animations.length > 0) {
      mixer = new THREE.AnimationMixer(clone)
      const clip = THREE.AnimationClip.findByName(animations, 'Fire') ?? animations[0]
      fireAction = mixer.clipAction(clip)
      fireAction.loop = THREE.LoopOnce
      fireAction.clampWhenFinished = true
    }

    return { inner, muzzleTip, mixer, fireAction, length: dims.x * s }
  }, [scene, animations, muzzle, size])
}

function PistolMesh({
  url,
  muzzle = 1,
  animated,
  fireSignal,
  aim,
  size = 1.7,
  autoRotate,
}: PistolMeshConfig & { autoRotate?: boolean }) {
  const { inner, muzzleTip, mixer, fireAction } = usePistolModel(url, muzzle, size)
  const group = useRef<THREE.Group>(null)
  const yawRef = useRef<THREE.Group>(null)
  const pitchRef = useRef<THREE.Group>(null)
  const flash = useRef<THREE.Group>(null)
  const flashLight = useRef<THREE.PointLight>(null)
  const lastFire = useRef(fireSignal?.current ?? 0)
  const flashTimer = useRef(0)

  useFrame((state, delta) => {
    mixer?.update(delta)

    if (fireSignal && fireSignal.current !== lastFire.current) {
      lastFire.current = fireSignal.current
      flashTimer.current = FLASH_DURATION
      fireAction?.reset().play()
    }
    if (flashTimer.current > 0) {
      flashTimer.current -= delta
      const on = flashTimer.current > 0
      if (flash.current) flash.current.visible = on
      if (flashLight.current) flashLight.current.intensity = on ? 16 : 0
    }

    if (aim) {
      if (yawRef.current) {
        const targetYaw = -state.pointer.x * 0.55
        yawRef.current.rotation.y = THREE.MathUtils.damp(
          yawRef.current.rotation.y,
          targetYaw,
          6,
          delta
        )
      }
      if (pitchRef.current) {
        const targetPitch = state.pointer.y * 0.32
        pitchRef.current.rotation.x = THREE.MathUtils.damp(
          pitchRef.current.rotation.x,
          targetPitch,
          6,
          delta
        )
      }
      return
    }

    if (!group.current) return
    const sway = autoRotate ? Math.sin(state.clock.elapsedTime * 0.5) * 0.55 : 0
    const targetY = state.pointer.x * 0.5 + sway + (muzzle === -1 ? Math.PI : 0)
    const targetX = -state.pointer.y * 0.25 + 0.1
    group.current.rotation.y = THREE.MathUtils.damp(group.current.rotation.y, targetY, 4, delta)
    group.current.rotation.x = THREE.MathUtils.damp(group.current.rotation.x, targetX, 4, delta)
  })

  const flashNodes = animated && (
    <>
      <group ref={flash} position={muzzleTip} visible={false}>
        <mesh>
          <sphereGeometry args={[0.09, 10, 10]} />
          <meshBasicMaterial color="#ffdd88" transparent opacity={0.9} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 4]}>
          <planeGeometry args={[0.42, 0.42]} />
          <meshBasicMaterial
            color="#ffcc66"
            transparent
            opacity={0.55}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      </group>
      <pointLight
        ref={flashLight}
        position={[muzzleTip.x * 1.1, muzzleTip.y, muzzleTip.z]}
        intensity={0}
        color="#ffcc77"
        distance={5}
      />
    </>
  )

  if (aim) {
    const baseYaw = muzzle === -1 ? -Math.PI / 2 : Math.PI / 2
    return (
      <group ref={yawRef}>
        <group ref={pitchRef}>
          <group rotation={[0, baseYaw, 0]}>
            <primitive object={inner} />
            {flashNodes}
          </group>
        </group>
      </group>
    )
  }

  return (
    <group ref={group}>
      <primitive object={inner} />
      {flashNodes}
    </group>
  )
}

export interface PistolViewerProps {
  modelUrl: string
  muzzle?: 1 | -1
  animated?: boolean
  fireSignal?: { current: number }
  aim?: boolean
  parallax?: boolean
  autoRotate?: boolean
  className?: string
  size?: number
  /** Model grubunun sahne içi konumu */
  position?: [number, number, number]
}

export function PistolViewer({
  modelUrl,
  muzzle = 1,
  animated = false,
  fireSignal,
  aim = false,
  parallax = true,
  autoRotate = false,
  className,
  size = 1.7,
  position,
}: PistolViewerProps) {
  return (
    <div className={className}>
      <Canvas
        camera={{ position: [0, 0.6, 4.2], fov: 38 }}
        dpr={[1, 1.75]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={null}>
          <group position={position}>
          <hemisphereLight intensity={0.5} groundColor={0x0a0a0a} />
          <directionalLight position={[3, 4, 5]} intensity={2.2} color={0xfff2cc} />
          <directionalLight position={[-4, 2, -3]} intensity={2.4} color={0xd4af37} />
          <directionalLight position={[0, -3, 2]} intensity={0.5} color={0x8899ff} />
          <pointLight position={[0, 0, 3]} intensity={12} color={0xffe9b0} distance={9} />
          <Environment preset="city" />
          <Float speed={1.6} rotationIntensity={aim ? 0 : 0.15} floatIntensity={aim ? 0.35 : 0.9}>
            <PistolMesh
              url={modelUrl}
              muzzle={muzzle}
              animated={animated}
              fireSignal={fireSignal}
              aim={aim}
              size={size}
              autoRotate={autoRotate}
            />
          </Float>
          <ContactShadows
            position={[0, -1.35, 0]}
            opacity={0.55}
            scale={7}
            blur={2.6}
            far={2.5}
            color="#d4af37"
          />
          </group>
        </Suspense>
      </Canvas>
    </div>
  )
}
