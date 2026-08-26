import { Suspense, useCallback, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { clone as skeletonClone } from 'three/addons/utils/SkeletonUtils.js'
import * as THREE from 'three'
import { getFlashTexture } from '@/lib/flashTexture'

export interface RangeSceneProps {
  active: boolean
  elapsed: number
  shotSignal: { current: number }
  reloadSignal: { current: number }
  aimRef: { current: { x: number; y: number } }
  /** Mobil joystick: aktifken aim bu vektörle döner */
  joystickVec: { current: { x: number; y: number } }
  joystickActive: { current: boolean }
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

/** Oyun içi namlu alevi: additive sprite, her atışta rastgele döner */
function MuzzleFlash({ innerRef }: { innerRef: React.RefObject<THREE.Group> }) {
  const tex = useMemo(() => getFlashTexture(), [])
  return (
    <group ref={innerRef} visible={false}>
      <mesh>
        <planeGeometry args={[0.55, 0.55]} />
        <meshBasicMaterial
          map={tex}
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[0.55, 0.55]} />
        <meshBasicMaterial
          map={tex}
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  )
}

function SteelTarget({
  data,
  active,
}: {
  data: TargetData
  active: boolean
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
    group.current.position.y = data.y - 1.1 * (1 - rise)
  })

  return (
    <group ref={group} position={[data.x, data.y - 1.1, data.z]}>
      {/* direk + ayak */}
      <mesh position={[0, -0.75, 0]}>
        <boxGeometry args={[0.09, 0.75, 0.06]} />
        <meshStandardMaterial color="#3a3a42" metalness={0.7} roughness={0.5} />
      </mesh>
      <mesh position={[0, -1.12, 0]}>
        <boxGeometry args={[0.55, 0.07, 0.45]} />
        <meshStandardMaterial color="#2c2c34" metalness={0.6} roughness={0.6} />
      </mesh>
      {/* insan silüeti karton hedef */}
      <HumanTargetMesh active={active} />
    </group>
  )
}

/** İnsan silüeti hedef (IPSC tarzı) — prosedürel karton hedef */
function HumanTargetMesh({ active }: { active: boolean }) {
  const { geom, cy } = useMemo(() => {
    const s = new THREE.Shape()
    s.moveTo(-0.11, 0.62)
    s.quadraticCurveTo(-0.13, 0.78, 0, 0.8)
    s.quadraticCurveTo(0.13, 0.78, 0.11, 0.62)
    s.lineTo(0.09, 0.55)
    s.quadraticCurveTo(0.26, 0.52, 0.3, 0.4)
    s.lineTo(0.32, 0.12)
    s.lineTo(0.22, 0.1)
    s.lineTo(0.19, -0.42)
    s.lineTo(-0.19, -0.42)
    s.lineTo(-0.22, 0.1)
    s.lineTo(-0.32, 0.12)
    s.lineTo(-0.3, 0.4)
    s.quadraticCurveTo(-0.26, 0.52, -0.09, 0.55)
    s.closePath()
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.04, bevelEnabled: false })
    g.center()
    const box = new THREE.Box3().setFromBufferAttribute(g.getAttribute('position') as THREE.BufferAttribute)
    const cy = (box.max.y + box.min.y) / 2
    return { geom: g, cy }
  }, [])

  return (
    <group visible={active}>
      <mesh geometry={geom}>
        <meshStandardMaterial color="#c9a06a" roughness={0.85} />
      </mesh>
      <mesh position={[0, cy - 0.02, 0.045]}>
        <ringGeometry args={[0.09, 0.13, 24]} />
        <meshStandardMaterial color="#f5f0e0" roughness={0.7} />
      </mesh>
      <mesh position={[0, cy - 0.02, 0.05]}>
        <circleGeometry args={[0.05, 20]} />
        <meshStandardMaterial color="#8b2020" roughness={0.6} />
      </mesh>
    </group>
  )
}

function Spark({ data, onDone }: { data: Spark; onDone: (id: number) => void }) {
  const ref = useRef<THREE.Mesh>(null)
  const tex = useMemo(() => getFlashTexture(), [])

  useFrame(() => {
    const l = (performance.now() / 1000 - data.born) / 0.3
    if (l >= 1) {
      onDone(data.id)
      return
    }
    if (ref.current) {
      ref.current.scale.setScalar(0.25 + l * 1.1)
      const mat = ref.current.material as THREE.MeshBasicMaterial
      mat.opacity = 1 - l
    }
  })

  return (
    <mesh ref={ref} position={[data.x, data.y, data.z]}>
      <planeGeometry args={[0.6, 0.6]} />
      <meshBasicMaterial
        map={tex}
        transparent
        opacity={0.9}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

function ViewModel({
  shotSignal,
  reloadSignal,
  aimRef,
  joystickVec,
  joystickActive,
  onShoot,
}: {
  shotSignal: { current: number }
  reloadSignal: { current: number }
  aimRef: { current: { x: number; y: number } }
  joystickVec: { current: { x: number; y: number } }
  joystickActive: { current: boolean }
  onShoot: (origin: THREE.Vector3, dir: THREE.Vector3) => void
}) {
  const { scene, animations } = useGLTF('/models/colt1911.glb')
  const yawRef = useRef<THREE.Group>(null)
  const pitchRef = useRef<THREE.Group>(null)
  const group = useRef<THREE.Group>(null)
  const flash = useRef<THREE.Group>(null)
  const flashLight = useRef<THREE.PointLight>(null)
  const lastShot = useRef(shotSignal.current)
  const lastReload = useRef(reloadSignal.current)
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
    const dims = box.getSize(new THREE.Vector3())
    // colt1911: uzun eksen Z, namlu -Z ucunda
    const maxDim = Math.max(dims.z, 1)
    const s = 0.62 / maxDim
    clone.scale.setScalar(s)
    clone.position.set(-center.x * s, -center.y * s, -center.z * s)
    // namlu ucu: -Z ucunda, namlu hattında (yüksek)
    const muzzleTip = new THREE.Vector3(
      0,
      ((box.max.y - center.y) * 0.78) * s,
      (box.min.z - center.z) * s
    )
    const mixer = new THREE.AnimationMixer(clone)
    const clip = THREE.AnimationClip.findByName(animations, 'Fire') ?? animations[0]
    // klip fazları: 0.2-2.44s şarjör değişimi (f6-73), 3.5-4.15s tetik+ateş (f106-125)
    // kök/el kanalları (Dyl, Gils, CORE) atılır — sadece mekanik parçalar kalsın
    const keep = /(Slide|Hammer|Trig|Magaz|Mag_button|Bullet)/
    const shotClip = THREE.AnimationUtils.subclip(clip, 'Shot', 106, 125, 30)
    shotClip.tracks = shotClip.tracks.filter((t) => keep.test(t.name))
    const shot = mixer.clipAction(shotClip)
    shot.loop = THREE.LoopOnce
    // clamp yok: animasyon bitince poz otomatik dinlenme pozuna döner
    shot.timeScale = 3
    const reloadClip = THREE.AnimationUtils.subclip(clip, 'Reload', 6, 73, 30)
    reloadClip.tracks = reloadClip.tracks.filter((t) => keep.test(t.name))
    const reload = mixer.clipAction(reloadClip)
    reload.loop = THREE.LoopOnce
    reload.timeScale = 2.1
    return { clone, mixer, shot, reload, muzzleTip }
  }, [scene, animations])

  useFrame((state, delta) => {
    prepared.mixer.update(delta)

    // joystick (mobil): aim'i knob yönünde döndür
    if (joystickActive.current) {
      aimRef.current.x = THREE.MathUtils.clamp(
        aimRef.current.x + joystickVec.current.x * 1.4 * delta,
        -1,
        1
      )
      aimRef.current.y = THREE.MathUtils.clamp(
        aimRef.current.y + joystickVec.current.y * 1.0 * delta,
        -1,
        1
      )
    }

    // imleci takip et (orta hassasiyet — gun baktığı yöne ateş eder)
    if (yawRef.current) {
      const targetYaw = -aimRef.current.x * 0.6
      yawRef.current.rotation.y = THREE.MathUtils.damp(
        yawRef.current.rotation.y,
        targetYaw,
        6,
        delta
      )
    }
    if (pitchRef.current) {
      const targetPitch = aimRef.current.y * 0.35
      pitchRef.current.rotation.x = THREE.MathUtils.damp(
        pitchRef.current.rotation.x,
        targetPitch,
        6,
        delta
      )
    }

    if (reloadSignal.current !== lastReload.current) {
      lastReload.current = reloadSignal.current
      prepared.reload.reset().play()
    }

    if (shotSignal.current !== lastShot.current) {
      lastShot.current = shotSignal.current
      prepared.shot.reset().play()
      flashPower.current = 1
      kick.current = 0.6
      if (flash.current) flash.current.rotation.z = Math.random() * Math.PI * 2

      // mermi gun'un BAKTIĞI yönde gider — imleç noktasına değil
      if (group.current) {
        const origin = prepared.muzzleTip.clone()
        group.current.localToWorld(origin)
        const ahead = prepared.muzzleTip.clone()
        ahead.z -= 12
        group.current.localToWorld(ahead)
        const dir = ahead.sub(origin).normalize()
        onShoot(origin, dir)
      }
    }
    kick.current = THREE.MathUtils.damp(kick.current, 0, 12, delta)
    flashPower.current = THREE.MathUtils.damp(flashPower.current, 0, 30, delta)

    // flaş pozisyonu: namlu ucu (group uzayında sabit)
    if (flash.current) {
      flash.current.position.copy(prepared.muzzleTip)
    }
    if (flashLight.current) {
      flashLight.current.position.set(
        prepared.muzzleTip.x,
        prepared.muzzleTip.y + 0.04,
        prepared.muzzleTip.z
      )
    }

    // mobil (dikey) yerleşim: gun ortada, biraz küçük ve aşağıda
    const portrait = state.size.width < 768
    const baseX = portrait ? 0 : 0.66
    const baseY = portrait ? 0.78 : 0.94
    const baseZ = portrait ? 2.7 : 2.55
    const baseScale = portrait ? 0.85 : 1

    if (group.current) {
      group.current.position.x = THREE.MathUtils.damp(group.current.position.x, baseX, 6, delta)
      group.current.position.y = THREE.MathUtils.damp(
        group.current.position.y,
        baseY + kick.current * 0.04,
        6,
        delta
      )
      group.current.position.z = THREE.MathUtils.damp(
        group.current.position.z,
        baseZ + kick.current * 0.06,
        6,
        delta
      )
      const sc = THREE.MathUtils.damp(group.current.scale.x, baseScale, 6, delta)
      group.current.scale.setScalar(sc)
    }
    const fp = Math.max(flashPower.current, 0)
    if (flash.current) {
      flash.current.visible = fp > 0.04
      flash.current.scale.setScalar(0.7 + fp * 0.9)
    }
    if (flashLight.current) flashLight.current.intensity = fp * 16
  })

  return (
    <group ref={yawRef}>
      <group ref={pitchRef}>
        <group ref={group} position={[0.66, 0.94, 2.55]} rotation={[0, 0.05, 0.02]}>
          <pointLight position={[0.4, 0.3, 0.5]} intensity={1.6} distance={3.5} color="#ffe9b0" />
          <primitive object={prepared.clone} />
          <MuzzleFlash innerRef={flash} />
          <pointLight
            ref={flashLight}
            intensity={0}
            color="#ffcc77"
            distance={6}
          />
        </group>
      </group>
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

/** Kenney CC0 prop: beyaz gelir, renk atayıp normalize ederiz */
function ColoredProp({
  url,
  color,
  metalness = 0.25,
  roughness = 0.7,
  scale = 1,
}: {
  url: string
  color: string
  metalness?: number
  roughness?: number
  scale?: number
}) {
  const { scene } = useGLTF(url)
  const model = useMemo(() => {
    const c = skeletonClone(scene)
    c.traverse((child) => {
      const mesh = child as THREE.Mesh
      if (mesh.isMesh) {
        const m = (mesh.material as THREE.MeshStandardMaterial).clone()
        m.color = new THREE.Color(color)
        m.metalness = metalness
        m.roughness = roughness
        mesh.material = m
      }
    })
    const box = new THREE.Box3().setFromObject(c)
    const size = box.getSize(new THREE.Vector3())
    const s = scale / Math.max(size.x, size.y, size.z, 0.001)
    c.scale.setScalar(s)
    return c
  }, [scene, color, metalness, roughness, scale])
  return <primitive object={model} />
}

function RangeEnvironment() {
  const trees = useMemo(
    () => [
      { url: '/models/props/tree_detailed.glb', x: -7.5, z: -8, s: 3.2, r: 0.4 },
      { url: '/models/props/tree_default.glb', x: 7.8, z: -10, s: 3.6, r: 1.2 },
      { url: '/models/props/tree_cone.glb', x: -8.5, z: -14, s: 3.8, r: 2 },
      { url: '/models/props/tree_detailed.glb', x: 8.2, z: -16, s: 3.4, r: 0.8 },
      { url: '/models/props/tree_default.glb', x: -6.5, z: -18, s: 3.5, r: 1.7 },
      { url: '/models/props/tree_cone.glb', x: 6.8, z: -4.5, s: 2.8, r: 0.2 },
    ],
    []
  )
  const bushes = useMemo(
    () => [
      { x: -4.6, z: -6, s: 0.8 },
      { x: 4.8, z: -7.5, s: 0.9 },
      { x: -5.2, z: -12, s: 1.0 },
      { x: 5.4, z: -13, s: 0.8 },
      { x: 3.9, z: -3.4, s: 0.6 },
    ],
    []
  )
  const grassTufts = useMemo(() => {
    const arr: { x: number; z: number; s: number; url: string }[] = []
    for (let i = 0; i < 26; i++) {
      arr.push({
        x: (Math.sin(i * 12.9898) * 43758.5453 % 1) * 14 - 7,
        z: -2 - (Math.abs(Math.sin(i * 78.233) * 43758.5453 % 1) * 14),
        s: 0.5 + (i % 3) * 0.2,
        url: i % 2 === 0 ? '/models/props/grass.glb' : '/models/props/grass_large.glb',
      })
    }
    return arr
  }, [])
  const rocks = useMemo(
    () => [
      { x: -4.2, z: -15.5, s: 0.7 },
      { x: 4.5, z: -11.5, s: 0.5 },
    ],
    []
  )
  const fences = useMemo(() => {
    const arr: { x: number; z: number; r: number }[] = []
    for (let i = 0; i < 6; i++) {
      arr.push({ x: -3.9 + i * 0.001, z: -1.2 - i * 1.05, r: 0 })
    }
    return arr.map((f) => ({ ...f, x: -4.05 }))
  }, [])

  return (
    <group>
      {/* çim zemin */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -7]} receiveShadow>
        <planeGeometry args={[40, 44]} />
        <meshStandardMaterial color="#5d8a44" roughness={0.95} />
      </mesh>
      {/* atış şeritleri — açık hava için soluk */}
      {[-1.8, 0, 1.8].map((x) => (
        <mesh key={x} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.01, -6]}>
          <planeGeometry args={[0.07, 15]} />
          <meshStandardMaterial color="#e8e4d0" roughness={0.9} />
        </mesh>
      ))}
      {/* gökyüzü rengine uyumlu sis + açık hava ışığı Canvas'ta */}

      {/* ağaçlar — saha çevresi */}
      {trees.map((t, i) => (
        <group key={i} position={[t.x, 0, t.z]} rotation={[0, t.r, 0]}>
          <ColoredProp url={t.url} color="#3f6b2e" roughness={0.9} scale={t.s} />
        </group>
      ))}
      {/* çalılar */}
      {bushes.map((b, i) => (
        <group key={i} position={[b.x, 0, b.z]}>
          <ColoredProp url="/models/props/plant_bush.glb" color="#4a7a38" roughness={0.9} scale={b.s} />
        </group>
      ))}
      {/* çim öbekleri */}
      {grassTufts.map((g, i) => (
        <group key={i} position={[g.x, 0, g.z]}>
          <ColoredProp url={g.url} color="#6b9a4a" roughness={0.95} scale={g.s} />
        </group>
      ))}
      {/* kayalar */}
      {rocks.map((r, i) => (
        <group key={i} position={[r.x, 0.1, r.z]} rotation={[0, i * 1.3, 0]}>
          <ColoredProp url="/models/props/rock_smallA.glb" color="#8a8a80" roughness={0.9} scale={r.s} />
        </group>
      ))}
      {/* oyuncunun arkasına ahşap çit */}
      {fences.map((f, i) => (
        <group key={i} position={[f.x, 0, f.z]}>
          <ColoredProp url="/models/props/fence_simple.glb" color="#7a5c38" roughness={0.85} scale={1.05} />
        </group>
      ))}
      {/* Kenney hedef pankartları arka duvar yerine: uzak sıra ağaç duvarı */}
      {[-6, -3, 0, 3, 6].map((x, i) => (
        <group key={x} position={[x, 0, -20 - (i % 2)]} rotation={[0, i % 2 === 0 ? 0.1 : -0.1, 0]}>
          <ColoredProp url="/models/props/tree_cone.glb" color="#35592a" roughness={0.9} scale={4.2} />
        </group>
      ))}
    </group>
  )
}

/** Dikey ekranda kamerayı geri alır, sahne "uzun ince" görünür */
function CameraFit() {
  const camera = useThree((s) => s.camera)
  const width = useThree((s) => s.size.width)
  useFrame((_, delta) => {
    const portrait = width < 768
    const targetZ = portrait ? 4.6 : 3.4
    camera.position.z = THREE.MathUtils.damp(camera.position.z, targetZ, 5, delta)
    camera.updateProjectionMatrix()
  })
  return null
}

/** İzli mermi çizgisi: kısa ömürlü, additive */
interface TracerData {
  id: number
  from: THREE.Vector3
  to: THREE.Vector3
  born: number
}

function Tracer({ data, onDone }: { data: TracerData; onDone: (id: number) => void }) {
  const lineObj = useMemo(() => {
    const geom = new THREE.BufferGeometry().setFromPoints([data.from, data.to])
    const mat = new THREE.LineBasicMaterial({
      color: '#ffd777',
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    return new THREE.Line(geom, mat)
  }, [data])

  useFrame(() => {
    const l = (performance.now() / 1000 - data.born) / 0.25
    if (l >= 1) {
      onDone(data.id)
      return
    }
    const mat = lineObj.material as THREE.LineBasicMaterial
    mat.opacity = 0.9 * (1 - l)
  })

  return <primitive object={lineObj} />
}

function raySphere(
  origin: THREE.Vector3,
  dir: THREE.Vector3,
  center: THREE.Vector3,
  r: number
): number | null {
  const oc = center.clone().sub(origin)
  const t = oc.dot(dir)
  if (t < 0) return null
  const d2 = oc.lengthSq() - t * t
  if (d2 > r * r) return null
  return t - Math.sqrt(r * r - d2)
}

export function RangeScene({
  active,
  elapsed,
  shotSignal,
  reloadSignal,
  aimRef,
  joystickVec,
  joystickActive,
  onHit,
  onMiss,
}: RangeSceneProps) {
  const [targets, setTargets] = useState<TargetData[]>([])
  const [sparks, setSparks] = useState<Spark[]>([])
  const [tracers, setTracers] = useState<TracerData[]>([])
  const targetsRef = useRef<TargetData[]>([])
  targetsRef.current = targets

  // atış: gun'un baktığı yönde raycast — hedef küre çarpışması
  const handleShoot = useCallback(
    (origin: THREE.Vector3, dir: THREE.Vector3) => {
      if (!active) return
      let best: { id: number; t: number; pos: THREE.Vector3 } | null = null
      for (const t of targetsRef.current) {
        const tt = raySphere(origin, dir, new THREE.Vector3(t.x, t.y, t.z), 0.45)
        if (tt !== null && (!best || tt < best.t)) {
          best = { id: t.id, t: tt, pos: new THREE.Vector3(t.x, t.y, t.z) }
        }
      }

      if (best) {
        setTargets((prev) => prev.filter((x) => x.id !== best!.id))
        setSparks((prev) => [
          ...prev.slice(-5),
          {
            id: nextId++,
            x: best!.pos.x,
            y: best!.pos.y,
            z: best!.pos.z + 0.1,
            born: performance.now() / 1000,
          },
        ])
        setTracers((prev) => [
          ...prev.slice(-6),
          { id: nextId++, from: origin.clone(), to: best!.pos.clone(), born: performance.now() / 1000 },
        ])
        onHit()
      } else {
        const tPlane = (-14.6 - origin.z) / dir.z
        const point = origin
          .clone()
          .add(dir.clone().multiplyScalar(Math.max(Math.min(tPlane, 20), 6)))
        setTracers((prev) => [
          ...prev.slice(-6),
          { id: nextId++, from: origin.clone(), to: point, born: performance.now() / 1000 },
        ])
        onMiss()
      }
    },
    [active, onHit, onMiss]
  )

  const removeSpark = (id: number) => setSparks((prev) => prev.filter((s) => s.id !== id))
  const removeTracer = (id: number) => setTracers((prev) => prev.filter((t) => t.id !== id))

  return (
    <Canvas
      camera={{ position: [0, 1.5, 3.4], fov: 62 }}
      dpr={[1, 1.75]}
      gl={{ antialias: true }}
      style={{ cursor: 'none' }}
    >
      <color attach="background" args={[0x9ec8e8]} />
      <fog attach="fog" args={[0x9ec8e8, 18, 42]} />

      <Suspense fallback={null}>
        <CameraFit />
        <Spawner active={active} elapsed={elapsed} setTargets={setTargets} />
        <hemisphereLight intensity={0.9} groundColor={0x3d5a2e} />
        <directionalLight position={[6, 9, 3]} intensity={2.4} color="#fff5e0" />
        <directionalLight position={[-6, 4, -4]} intensity={0.8} color="#cfe5ff" />

        <ViewModel
          shotSignal={shotSignal}
          reloadSignal={reloadSignal}
          aimRef={aimRef}
          joystickVec={joystickVec}
          joystickActive={joystickActive}
          onShoot={handleShoot}
        />
        <RangeEnvironment />

        {targets.map((t) => (
          <SteelTarget key={t.id} data={t} active={active} />
        ))}
        {sparks.map((s) => (
          <Spark key={s.id} data={s} onDone={removeSpark} />
        ))}
        {tracers.map((t) => (
          <Tracer key={t.id} data={t} onDone={removeTracer} />
        ))}
      </Suspense>
    </Canvas>
  )
}
