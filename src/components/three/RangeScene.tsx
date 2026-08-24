import { Suspense, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, type ThreeEvent } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'

export interface RangeSceneProps {
  active: boolean
  elapsed: number
  shotSignal: { current: number }
  onHit: () => void
  onMiss: () => void
}

interface TargetData {
  id: number
  x: number
  y: number
  z: number
  born: number
  ttl: number
}

interface Spark {
  id: number
  x: number
  y: number
  z: number
  born: number
}

let nextId = 1

function SteelTarget({
  data,
  active,
  onHit,
}: {
  data: TargetData
  active: boolean
  onHit: (e: ThreeEvent<PointerEvent>) => void
}) {
  const mesh = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (!mesh.current) return
    const age = state.clock.elapsedTime - data.born
    const life = Math.min(age / 0.18, 1)
    const dying = age > data.ttl - 0.15
    const scale = dying ? Math.max(1 - (age - (data.ttl - 0.15)) / 0.15, 0) : life
    mesh.current.scale.setScalar(Math.max(scale, 0.001))
    mesh.current.rotation.y = Math.sin(age * 3) * 0.08
  })

  return (
    <group ref={mesh} position={[data.x, data.y, data.z]}>
      <mesh onPointerDown={onHit} visible={active}>
        <cylinderGeometry args={[0.42, 0.42, 0.07, 28]} />
        <meshStandardMaterial
          color="#d8d8e2"
          metalness={0.55}
          roughness={0.35}
          emissive="#9a9aa8"
          emissiveIntensity={0.22}
        />
      </mesh>
      <mesh position={[0, 0, 0.045]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.24, 0.32, 28]} />
        <meshStandardMaterial
          color="#d4af37"
          metalness={0.5}
          roughness={0.35}
          emissive="#d4af37"
          emissiveIntensity={0.7}
        />
      </mesh>
      <mesh position={[0, 0, 0.05]} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.1, 20]} />
        <meshStandardMaterial color="#b02a2a" roughness={0.5} emissive="#7a1a1a" emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[0, -0.55, 0]}>
        <boxGeometry args={[0.07, 0.7, 0.05]} />
        <meshStandardMaterial color="#3a3a40" metalness={0.7} roughness={0.5} />
      </mesh>
    </group>
  )
}

function Spark({ data, onDone }: { data: Spark; onDone: (id: number) => void }) {
  const ref = useRef<THREE.Mesh>(null)
  const life = (performance.now() / 1000 - data.born) / 0.3

  useFrame(() => {
    const l = (performance.now() / 1000 - data.born) / 0.3
    if (l >= 1) {
      onDone(data.id)
      return
    }
    if (ref.current) {
      ref.current.scale.setScalar(0.2 + l * 1.4)
      const mat = ref.current.material as THREE.MeshBasicMaterial
      mat.opacity = 1 - l
    }
  })

  return (
    <mesh ref={ref} position={[data.x, data.y, data.z]} rotation={[Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.3, 0.42, 24]} />
      <meshBasicMaterial color="#ffd777" transparent opacity={0.9} side={THREE.DoubleSide} />
    </mesh>
  )
}

function ViewModel({ shotSignal }: { shotSignal: { current: number } }) {
  const { scene } = useGLTF('/models/glock18c.glb')
  const group = useRef<THREE.Group>(null)
  const flash = useRef<THREE.Group>(null)
  const flashLight = useRef<THREE.PointLight>(null)
  const recoil = useRef(0)
  const lastShot = useRef(shotSignal.current)
  const flashPower = useRef(0)

  const clone = useMemo(() => scene.clone(true), [scene])
  clone.traverse((child) => {
    const mesh = child as THREE.Mesh
    if (mesh.isMesh) {
      mesh.material = Array.isArray(mesh.material)
        ? mesh.material.map((m) => {
            const c = (m as THREE.MeshStandardMaterial).clone()
            c.metalness = Math.max(c.metalness ?? 0.4, 0.6)
            c.roughness = Math.min(c.roughness ?? 0.5, 0.4)
            c.envMapIntensity = 1.2
            return c
          })
        : mesh.material
    }
  })

  useFrame((_, delta) => {
    if (shotSignal.current !== lastShot.current) {
      lastShot.current = shotSignal.current
      recoil.current = 1
      flashPower.current = 1
    }
    recoil.current = THREE.MathUtils.damp(recoil.current, 0, 10, delta)
    flashPower.current = THREE.MathUtils.damp(flashPower.current, 0, 26, delta)

    if (group.current) {
      group.current.position.set(0.66, 0.94, 2.55)
      group.current.position.z += recoil.current * 0.12
      group.current.position.y += recoil.current * 0.03
      group.current.rotation.set(recoil.current * 0.32, -Math.PI / 2 - 0.06, 0.02)
    }
    const fp = Math.max(flashPower.current, 0)
    if (flash.current) {
      flash.current.visible = fp > 0.05
      flash.current.scale.setScalar(0.5 + fp * 0.8)
    }
    if (flashLight.current) flashLight.current.intensity = fp * 14
  })

  return (
    <group ref={group}>
      <pointLight position={[0.4, 0.3, 0.5]} intensity={1.6} distance={3.5} color="#ffe9b0" />
      <primitive object={clone} scale={0.32} />
      <group ref={flash} position={[-0.98, 0.28, 0]} visible={false}>
        <mesh>
          <sphereGeometry args={[0.09, 10, 10]} />
          <meshBasicMaterial color="#ffdd88" transparent opacity={0.9} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 4]}>
          <planeGeometry args={[0.5, 0.5]} />
          <meshBasicMaterial color="#ffcc66" transparent opacity={0.55} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      </group>
      <pointLight ref={flashLight} position={[-1.15, 0.3, 0]} intensity={0} color="#ffcc77" distance={6} />
    </group>
  )
}

function Spawner({
  active,
  elapsed,
  setTargets,
}: {
  active: boolean
  elapsed: number
  setTargets: React.Dispatch<React.SetStateAction<TargetData[]>>
}) {
  const spawnClock = useRef(0)
  useFrame((state, delta) => {
    if (!active) return
    spawnClock.current += delta
    const interval = Math.max(0.45, 0.95 - elapsed * 0.016)
    if (spawnClock.current >= interval) {
      spawnClock.current = 0
      const ttl = Math.max(0.95, 1.5 - elapsed * 0.02)
      const target: TargetData = {
        id: nextId++,
        x: (Math.random() - 0.5) * 5,
        y: 0.9 + Math.random() * 1.7,
        z: -(5.5 + Math.random() * 3.5),
        born: state.clock.elapsedTime,
        ttl,
      }
      setTargets((prev) => [...prev.slice(-7), target])
    }

    setTargets((prev) => {
      const kept = prev.filter((t) => state.clock.elapsedTime - t.born < t.ttl)
      return kept.length === prev.length ? prev : kept
    })
  })
  return null
}

export function RangeScene({ active, elapsed, shotSignal, onHit, onMiss }: RangeSceneProps) {
  const [targets, setTargets] = useState<TargetData[]>([])
  const [sparks, setSparks] = useState<Spark[]>([])

  const handleHit = (target: TargetData) => (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    if (!active) return
    setTargets((prev) => prev.filter((t) => t.id !== target.id))
    setSparks((prev) => [
      ...prev.slice(-5),
      { id: nextId++, x: target.x, y: target.y, z: target.z + 0.1, born: performance.now() / 1000 },
    ])
    onHit()
  }

  const removeSpark = (id: number) => setSparks((prev) => prev.filter((s) => s.id !== id))

  return (
    <Canvas
      camera={{ position: [0, 1.5, 3.4], fov: 62 }}
      dpr={[1, 1.75]}
      gl={{ antialias: true }}
      style={{ cursor: 'none' }}
    >
      <color attach="background" args={[0x0b0b0e]} />
      <fog attach="fog" args={[0x0b0b0e, 9, 22]} />

      <Suspense fallback={null}>
        <Spawner active={active} elapsed={elapsed} setTargets={setTargets} />
        <hemisphereLight intensity={0.75} groundColor={0x1a1a20} />
        <directionalLight position={[4, 6, 2]} intensity={2.2} color="#fff1cc" />
        <directionalLight position={[-5, 3, -4]} intensity={1.4} color="#d4af37" />
        <pointLight position={[0, 2.6, -6]} intensity={26} color="#ffe2a0" distance={14} />

        <ViewModel shotSignal={shotSignal} />

        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -6]} receiveShadow>
          <planeGeometry args={[30, 30]} />
          <meshStandardMaterial color="#26262e" metalness={0.15} roughness={0.8} />
        </mesh>
        <mesh position={[0, 3, -12]}>
          <planeGeometry args={[30, 12]} />
          <meshStandardMaterial color="#202028" roughness={0.9} />
        </mesh>

        {[-3.2, 3.2].map((x) => (
          <mesh key={x} position={[x, 1.6, -8]}>
            <boxGeometry args={[0.12, 3.2, 10]} />
            <meshStandardMaterial color="#2c2c36" roughness={0.8} metalness={0.2} />
          </mesh>
        ))}
        {[2.2, 5.4, 8.6].map((z, i) => (
          <mesh key={z} position={[-3.13, 1.6, -z]} rotation={[0, Math.PI / 2, 0]}>
            <planeGeometry args={[0.5, 2.6]} />
            <meshStandardMaterial color="#d4af37" emissive="#d4af37" emissiveIntensity={0.9} />
          </mesh>
        ))}

        <mesh
          position={[0, 2, -11.5]}
          onPointerDown={() => {
            if (active) onMiss()
          }}
        >
          <planeGeometry args={[30, 12]} />
          <meshBasicMaterial visible={false} />
        </mesh>

        {targets.map((t) => (
          <SteelTarget key={t.id} data={t} active={active} onHit={handleHit(t)} />
        ))}
        {sparks.map((s) => (
          <Spark key={s.id} data={s} onDone={removeSpark} />
        ))}
      </Suspense>
    </Canvas>
  )
}
