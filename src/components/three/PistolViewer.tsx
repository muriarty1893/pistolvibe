import { Suspense, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF, Float, ContactShadows, Environment } from '@react-three/drei'
import * as THREE from 'three'

function PistolMesh({
  url,
  parallax,
  autoRotate,
  size = 1.7,
}: {
  url: string
  parallax?: boolean
  autoRotate?: boolean
  size?: number
}) {
  const { scene } = useGLTF(url)
  const group = useRef<THREE.Group>(null)
  const pointer = useRef({ x: 0, y: 0 })

  const clone = useMemo(() => {
    const c = scene.clone(true)
    const box = new THREE.Box3().setFromObject(c)
    const dims = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())
    const maxDim = Math.max(dims.x, dims.y, dims.z) || 1
    const s = size / maxDim
    c.scale.setScalar(s)
    c.position.set(-center.x * s, -center.y * s, -center.z * s)
    return c
  }, [scene, size])

  useMemo(() => {
    clone.traverse((child) => {
      const mesh = child as THREE.Mesh
      if (mesh.isMesh) {
        mesh.material = Array.isArray(mesh.material)
          ? mesh.material.map((m) => {
              const c = (m as THREE.MeshStandardMaterial).clone()
              if (c.color) c.color.convertSRGBToLinear()
              c.metalness = Math.max(c.metalness ?? 0.4, 0.55)
              c.roughness = Math.min(c.roughness ?? 0.5, 0.45)
              c.envMapIntensity = 1.4
              return c
            })
          : mesh.material
        mesh.castShadow = true
      }
    })
  }, [clone])

  useFrame((state, delta) => {
    if (!group.current) return
    if (parallax) {
      pointer.current.x = state.pointer.x
      pointer.current.y = state.pointer.y
    }
    const sway = autoRotate ? Math.sin(state.clock.elapsedTime * 0.5) * 0.55 : 0
    const targetY = pointer.current.x * 0.5 + sway
    const targetX = -pointer.current.y * 0.25 + 0.1
    group.current.rotation.y = THREE.MathUtils.damp(
      group.current.rotation.y,
      targetY,
      4,
      delta
    )
    group.current.rotation.x = THREE.MathUtils.damp(
      group.current.rotation.x,
      targetX,
      4,
      delta
    )
  })

  return (
    <group ref={group}>
      <primitive object={clone} />
    </group>
  )
}

export interface PistolViewerProps {
  modelUrl: string
  parallax?: boolean
  autoRotate?: boolean
  className?: string
  size?: number
}

export function PistolViewer({
  modelUrl,
  parallax = true,
  autoRotate = false,
  className,
  size = 1.7,
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
          <hemisphereLight intensity={0.5} groundColor={0x0a0a0a} />
          <directionalLight position={[3, 4, 5]} intensity={2.2} color={0xfff2cc} />
          <directionalLight position={[-4, 2, -3]} intensity={2.4} color={0xd4af37} />
          <directionalLight position={[0, -3, 2]} intensity={0.5} color={0x8899ff} />
          <pointLight position={[0, 0, 3]} intensity={12} color={0xffe9b0} distance={9} />
          <Environment preset="city" />
          <Float speed={1.6} rotationIntensity={0.15} floatIntensity={0.9}>
            <PistolMesh url={modelUrl} parallax={parallax} autoRotate={autoRotate} size={size} />
          </Float>
          <ContactShadows
            position={[0, -1.35, 0]}
            opacity={0.55}
            scale={7}
            blur={2.6}
            far={2.5}
            color="#d4af37"
          />
        </Suspense>
      </Canvas>
    </div>
  )
}
