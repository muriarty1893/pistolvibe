import { Suspense, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, type ThreeEvent } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { clone as skeletonClone } from 'three/addons/utils/SkeletonUtils.js'
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

const RISE_DURATION = 0.28
const FALL_DURATION = 0.16

function SteelTarget({
  data,
  active,
  onHit,
}: {
  data: TargetData
  active: boolean
  onHit: (e: ThreeEvent<PointerEvent>) => void
}) {
  const group = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (!group.current) return
    const age = state.clock.elapsedTime - data.born
    let rise: number
    if (age < RISE_DURATION) {
      const t = age / RISE_DURATION
      rise = 1 - Math.pow(1 - t, 3)
    } else if (age > data.ttl - FALL_DURATION) {
      rise = Math.max(1 - (age - (data.ttl - FALL_DURATION)) / FALL_DURATION, 0)
    } else {
      rise = 1
    }
    group.current.position.y = data.y - 0.9 * (1 - rise)
    group.current.rotation.y = Math.sin(age * 3) * 0.06
  })

  return (
    <group ref={group} position={[data.x, data.y - 0.9, data.z]}>
      {/* stand: hedef yükselirken zeminde kalır */}
      <mesh position={[0, -0.62, 0]}>
        <boxGeometry args={[0.08, 0.62, 0.05]} />
        <meshStandardMaterial color="#3a3a42" metalness={0.7} roughness={0.5} />
      </mesh>
      <mesh position={[0, -0.92, 0]} visible={active}>
        <boxGeometry args={[0.5, 0.06, 0.4]} />
        <meshStandardMaterial color="#2c2c34" metalness={0.6} roughness={0.6} />
      </mesh>
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
    </group>
  )
}

function Spark({ data, onDone }: { data: Spark; onDone: (id: number) => void }) {
  const ref = useRef<THREE.Mesh>(null)

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
  const { scene, animations } = useGLTF('/models/colt_m1911.glb')
  const group = useRef<THREE.Group>(null)
  const flash = useRef<THREE.Group>(null)
  const flashLight = useRef<THREE.PointLight>(null)
  const lastShot = useRef(shotSignal.current)
  const flashPower = useRef(0)
  const kick = useRef(0)

  const prepared = useMemo(() => {
    const clone = skeletonClone(scene)
    clone.traverse((child) => {
      const mesh = child as THREE.Mesh
      if (mesh.isMesh) {
        mesh.material = Array.isArray(mesh.material)
          ? mesh.material.map((m) => {
              const c = (m as THREE.MeshStandardMaterial).clone()
              c.metalness = Math.max(c.metalness ?? 0.4, 0.6)
              c.roughness = Math.min(c.roughness ?? 0.5, 0.4)
              c.envMapIntensity = 1.1
              return c
            })
          : mesh.material
      }
    })
    const box = new THREE.Box3().setFromObject(clone)
    const center = box.getCenter(new THREE.Vector3())
    const maxDim = Math.max(box.getSize(new THREE.Vector3()).x, 1)
    const s = 0.62 / maxDim
    clone.scale.setScalar(s)
    clone.position.set(-center.x * s, -center.y * s, -center.z * s)
    const mixer = new THREE.AnimationMixer(clone)
    const clip = THREE.AnimationClip.findByName(animations, 'Fire') ?? animations[0]
    const action = mixer.clipAction(clip)
    action.loop = THREE.LoopOnce
    action.clampWhenFinished = true
    return { clone, s, mixer, action }
  }, [scene, animations])

  useFrame((_, delta) => {
    prepared.mixer.update(delta)

    if (shotSignal.current !== lastShot.current) {
      lastShot.current = shotSignal.current
      prepared.action.reset().play()
      flashPower.current = 1
      kick.current = 1
    }
    kick.current = THREE.MathUtils.damp(kick.current, 0, 12, delta)
    flashPower.current = THREE.MathUtils.damp(flashPower.current, 0, 26, delta)

    if (group.current) {
      group.current.position.set(0.66, 0.94, 2.55)
      group.current.position.z += kick.current * 0.1
      group.current.position.y += kick.current * 0.025
      group.current.rotation.set(kick.current * 0.22, -Math.PI / 2 - 0.06, 0.02)
    }
    const fp = Math.max(flashPower.current, 0)
    if (flash.current) {
      flash.current.visible = fp > 0.05
      flash.current.scale.setScalar(0.5 + fp * 0.8)
    }
    if (flashLight.current) flashLight.current.intensity = fp * 14
  })

  // colt: namlu -X; group rotation.y=-π/2 namluyu -Z'ye çevirir
  const muzzleLocal = useMemo(
    () => new THREE.Vector3(-0.52, 0.06, 0),
    []
  )

  return (
    <group ref={group}>
      <pointLight position={[0.4, 0.3, 0.5]} intensity={1.6} distance={3.5} color="#ffe9b0" />
      <primitive object={prepared.clone} />
      <group ref={flash} position={muzzleLocal} visible={false}>
        <mesh>
          <sphereGeometry args={[0.07, 10, 10]} />
          <meshBasicMaterial color="#ffdd88" transparent opacity={0.9} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 4]}>
          <planeGeometry args={[0.4, 0.4]} />
          <meshBasicMaterial color="#ffcc66" transparent opacity={0.55} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      </group>
      <pointLight ref={flashLight} position={[-0.6, 0.08, 0]} intensity={0} color="#ffcc77" distance={6} />
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
        x: (Math.random() - 0.5) * 4,
        y: 1.0 + Math.random() * 1.4,
        z: -(5 + Math.random() * 3.5),
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

function RangeEnvironment() {
  return (
    <group>
      {/* zemin */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -5]} receiveShadow>
        <planeGeometry args={[24, 26]} />
        <meshStandardMaterial color="#26262e" metalness={0.15} roughness={0.8} />
      </mesh>
      {/* atış şeritleri */}
      {[-1.8, 0, 1.8].map((x) => (
        <mesh key={x} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.01, -6]}>
          <planeGeometry args={[0.06, 16]} />
          <meshStandardMaterial color="#d4af37" emissive="#8a6d1f" emissiveIntensity={0.55} />
        </mesh>
      ))}
      {/* yan duvarlar - tam yükseklik */}
      {[-3.6, 3.6].map((x) => (
        <mesh key={x} position={[x, 2.4, -6]}>
          <boxGeometry args={[0.35, 4.8, 18]} />
          <meshStandardMaterial color="#2c2c36" roughness={0.85} metalness={0.2} />
        </mesh>
      ))}
      {/* yan duvar panel çizgileri */}
      {[-3.4, 3.4].map((x) =>
        [1.2, 2.4].map((y) => (
          <mesh key={`${x}-${y}`} position={[x, y, -6]}>
            <boxGeometry args={[0.02, 0.05, 17.6]} />
            <meshStandardMaterial color="#d4af37" emissive="#d4af37" emissiveIntensity={0.5} />
          </mesh>
        ))
      )}
      {/* tavan */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 4.8, -6]}>
        <planeGeometry args={[7.6, 18]} />
        <meshStandardMaterial color="#1a1a21" roughness={0.9} />
      </mesh>
      {/* tavan ışık bantları */}
      {[-1.9, 1.9].map((x) => (
        <mesh key={x} rotation={[Math.PI / 2, 0, 0]} position={[x, 4.75, -6]}>
          <planeGeometry args={[0.5, 14]} />
          <meshStandardMaterial color="#fff3d6" emissive="#ffe9b8" emissiveIntensity={1.6} />
        </mesh>
      ))}
      {/* arka duvar */}
      <mesh position={[0, 2.4, -14.8]}>
        <planeGeometry args={[8, 4.8]} />
        <meshStandardMaterial color="#202028" roughness={0.9} />
      </mesh>
      {/* arka duvar panel dokusu */}
      {[-2.4, -0.8, 0.8, 2.4].map((x) => (
        <mesh key={x} position={[x, 1.6, -14.7]}>
          <planeGeometry args={[1.2, 2.4]} />
          <meshStandardMaterial color="#2a2a34" roughness={0.85} metalness={0.15} />
        </mesh>
      ))}
    </group>
  )
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
      <fog attach="fog" args={[0x0b0b0e, 10, 24]} />

      <Suspense fallback={null}>
        <Spawner active={active} elapsed={elapsed} setTargets={setTargets} />
        <hemisphereLight intensity={0.55} groundColor={0x1a1a20} />
        <directionalLight position={[4, 6, 2]} intensity={1.6} color="#fff1cc" />
        <directionalLight position={[-5, 3, -4]} intensity={1} color="#d4af37" />
        <pointLight position={[0, 4.2, -6]} intensity={30} color="#ffe2a0" distance={16} />

        <ViewModel shotSignal={shotSignal} />
        <RangeEnvironment />

        <mesh
          position={[0, 2, -14.6]}
          onPointerDown={() => {
            if (active) onMiss()
          }}
        >
          <planeGeometry args={[8, 5]} />
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
