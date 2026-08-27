import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useTexture, useGLTF } from '@react-three/drei'
import { clone as skeletonClone } from 'three/addons/utils/SkeletonUtils.js'
import * as THREE from 'three'
import { getFlashTexture } from '@/lib/flashTexture'

export interface RangeSceneProps {
  active: boolean
  shotSignal: { current: number }
  reloadSignal: { current: number }
  aimRef: { current: { x: number; y: number } }
  /** Mobil joystick: aktifken aim bu vektörle döner */
  joystickVec: { current: { x: number; y: number } }
  joystickActive: { current: boolean }
  onHit: () => void
  onMiss: () => void
  /** Süresi dolup kaçan hedef sayısı (oyun sonu sayacı) */
  onEscape: (n: number) => void
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

const _muzzleQ = new THREE.Quaternion()
const _aheadV = new THREE.Vector3()
const muzzleOffsetV = new THREE.Vector3()

const RISE_DURATION = 0.28
const FALL_DURATION = 0.16

/** Oyun içi namlu alevi: additive sprite, her atışta rastgele döner */
function MuzzleFlash({ innerRef }: { innerRef: React.RefObject<THREE.Group> }) {
  const tex = useMemo(() => getFlashTexture(), [])
  return (
    <group ref={innerRef} visible={false}>
      <mesh>
        <planeGeometry args={[0.34, 0.34]} />
        <meshBasicMaterial
          map={tex}
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[0.34, 0.34]} />
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

function PanelTarget({
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
      {/* direk: panelden yere kadar — her yükseklik için zemine oturur */}
      <mesh position={[0, -(data.y + 0.5) / 2, 0]}>
        <boxGeometry args={[0.09, data.y - 0.3, 0.06]} />
        <meshStandardMaterial color="#3a3a42" metalness={0.7} roughness={0.5} />
      </mesh>
      {/* ayak: zeminde, direk biter */}
      <mesh position={[0, -data.y + 0.015, 0]}>
        <boxGeometry args={[0.55, 0.07, 0.45]} />
        <meshStandardMaterial color="#2c2c34" metalness={0.6} roughness={0.6} />
      </mesh>
      {/* tahta panel hedef */}
      <WoodPanel active={active} />
    </group>
  )
}

const WOOD_TONES = ['#b98a4e', '#c49a62', '#ab7c44']

/** Vurulabilir tahta panel: dikey liteler + arka çapraz destek + boyalı nişan halkası */
function WoodPanel({ active }: { active: boolean }) {
  const planks = useMemo(
    () =>
      [-0.21, 0, 0.21].map((x, i) => ({
        x: x + (i - 1) * 0.004,
        tone: WOOD_TONES[i % WOOD_TONES.length],
        ry: (i - 1) * 0.012,
      })),
    []
  )

  return (
    <group visible={active}>
      {planks.map((p, i) => (
        <mesh key={i} position={[p.x, 0, 0]} rotation={[0, p.ry, 0]}>
          <boxGeometry args={[0.2, 1.0, 0.05]} />
          <meshStandardMaterial color={p.tone} roughness={0.85} />
        </mesh>
      ))}
      {/* arka çapraz destek */}
      <mesh position={[0, -0.18, -0.045]} rotation={[0, 0, 0.03]}>
        <boxGeometry args={[0.68, 0.14, 0.035]} />
        <meshStandardMaterial color="#8f6a3a" roughness={0.9} />
      </mesh>
      {/* boyalı nişan halkası */}
      <mesh position={[0, 0.02, 0.032]}>
        <ringGeometry args={[0.1, 0.145, 28]} />
        <meshStandardMaterial color="#f5f0e0" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.02, 0.033]}>
        <circleGeometry args={[0.055, 22]} />
        <meshStandardMaterial color="#a52525" roughness={0.6} />
      </mesh>
      {/* çiviler */}
      {[-0.3, 0.3].map((x) => (
        <mesh key={x} position={[x, 0.36, 0.031]}>
          <circleGeometry args={[0.014, 10]} />
          <meshStandardMaterial color="#4a3826" roughness={0.6} />
        </mesh>
      ))}
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
    // namlu ucu: Slide_012 kemiğinden canlı hesaplanır (poza kilitli)
    // kemik normalize uzayda z=-0.085'te; namlu ağzı -0.31 → kemikten 0.225 ileri, boru hattında
    const slideBone = clone.getObjectByName('Slide_012') ?? null
    const muzzleOffset = new THREE.Vector3(0, 0.004, -0.225)
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
    return { clone, mixer, shot, reload, slideBone, muzzleOffset }
  }, [scene, animations])

  // namlu ucunun world pozisyonu: slide kemiğinin world noktası + assembly uzayında namlu ofseti
  // (kemiğin kendi rest rotasyonu eksen kaydırır; yön group quaternion'undan alınır)
  const getMuzzleWorld = (out: THREE.Vector3) => {
    if (!prepared.slideBone || !group.current) return out.set(0, 0, 0)
    prepared.slideBone.updateWorldMatrix(true, false)
    out.setFromMatrixPosition(prepared.slideBone.matrixWorld)
    group.current.getWorldQuaternion(_muzzleQ)
    return out.add(muzzleOffsetV.copy(prepared.muzzleOffset).applyQuaternion(_muzzleQ))
  }

  useFrame((state, delta) => {
    prepared.mixer.update(delta)

    // joystick (mobil): aim'i knob yönünde döndür (yumuşak, düşük duyarlılık)
    if (joystickActive.current) {
      aimRef.current.x = THREE.MathUtils.clamp(
        aimRef.current.x + joystickVec.current.x * 0.7 * delta,
        -1,
        1
      )
      aimRef.current.y = THREE.MathUtils.clamp(
        aimRef.current.y + joystickVec.current.y * 0.5 * delta,
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
        const origin = getMuzzleWorld(new THREE.Vector3())
        group.current.getWorldQuaternion(_muzzleQ)
        const dir = _aheadV.set(0, 0, -1).applyQuaternion(_muzzleQ).normalize()
        onShoot(origin, dir)
      }
    }
    kick.current = THREE.MathUtils.damp(kick.current, 0, 12, delta)
    flashPower.current = THREE.MathUtils.damp(flashPower.current, 0, 30, delta)

    // flaş: namlu ucunda (slide kemiğinden canlı) — world → group lokaline çevrilir
    if (flash.current && group.current) {
      getMuzzleWorld(flash.current.position)
      group.current.worldToLocal(flash.current.position)
    }
    if (flashLight.current && group.current) {
      getMuzzleWorld(flashLight.current.position)
      flashLight.current.position.y += 0.04
      group.current.worldToLocal(flashLight.current.position)
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
      flash.current.scale.setScalar(0.55 + fp * 0.7)
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
  setTargets,
}: {
  active: boolean
  setTargets: React.Dispatch<React.SetStateAction<TargetData[]>>
}) {
  const spawnClock = useRef(0)
  const runTime = useRef(0)
  useFrame((state, delta) => {
    if (!active) return
    runTime.current += delta
    const t = runTime.current
    spawnClock.current += delta
    // Subway Surfers rampası: yumuşak başlangıç, zamanla hızlanan baskı
    const interval = Math.max(0.34, 1.05 - t * 0.022)
    if (spawnClock.current >= interval) {
      spawnClock.current = 0
      const ttl = Math.max(0.85, 2.0 - t * 0.028)
      const target: TargetData = {
        id: nextId++,
        x: (Math.random() - 0.5) * 4,
        y: 1.0 + Math.random() * 1.4,
        z: -(5 + Math.random() * 3.5),
        born: state.clock.elapsedTime,
        ttl,
      }
      setTargets((prev) => [...prev.slice(-11), target])
    }
  })
  return null
}

/** Süresi dolup kaçan hedefleri sayar — StrictMode güvenli: yan etkiler updater dışında */
function TargetLifecycle({
  active,
  targetsRef,
  setTargets,
  onEscape,
}: {
  active: boolean
  targetsRef: { current: TargetData[] }
  setTargets: React.Dispatch<React.SetStateAction<TargetData[]>>
  onEscape: (n: number) => void
}) {
  useFrame((state) => {
    if (!active) return
    const prev = targetsRef.current
    if (prev.length === 0) return
    const now = state.clock.elapsedTime
    let escaped = 0
    for (const t of prev) if (now - t.born >= t.ttl) escaped++
    if (escaped > 0) {
      setTargets((cur) => cur.filter((t) => now - t.born < t.ttl))
      onEscape(escaped)
    }
  })
  return null
}

/** Dokulu CC0 prop (Quaternius Stylized Nature / Eclair): orijinal malzeme korunur, normalize edilir */
function NatureProp({
  url,
  x,
  z,
  s = 1,
  ry = 0,
  y = 0,
}: {
  url: string
  x: number
  z: number
  s?: number
  ry?: number
  y?: number
}) {
  const { scene } = useGLTF(url)
  const model = useMemo(() => {
    const c = scene.clone(true)
    const box = new THREE.Box3().setFromObject(c)
    const size = box.getSize(new THREE.Vector3())
    const k = s / Math.max(size.x, size.y, size.z, 0.001)
    c.scale.setScalar(k)
    c.updateMatrixWorld(true)
    const b2 = new THREE.Box3().setFromObject(c)
    c.position.y = y - b2.min.y
    return c
  }, [scene, s, y])
  return (
    <group position={[x, 0, z]} rotation={[0, ry, 0]}>
      <primitive object={model} />
    </group>
  )
}

const ENV_URLS = [
  '/models/env/commontree-1.glb',
  '/models/env/commontree-2.glb',
  '/models/env/commontree-3.glb',
  '/models/env/commontree-4.glb',
  '/models/env/commontree-5.glb',
  '/models/env/pine-1.glb',
  '/models/env/pine-2.glb',
  '/models/env/pine-3.glb',
  '/models/env/pine-4.glb',
  '/models/env/pine-5.glb',
  '/models/env/deadtree-1.glb',
  '/models/env/deadtree-2.glb',
  '/models/env/twistedtree-1.glb',
  '/models/env/bush-common-flowers.glb',
  '/models/env/fern.glb',
  '/models/env/plant-1-big.glb',
  '/models/env/grass-common-tall.glb',
  '/models/env/grass-common-short.glb',
  '/models/env/grass-wispy-tall.glb',
  '/models/env/flower-3-group.glb',
  '/models/env/flower-4-group.glb',
  '/models/env/rock-medium-1.glb',
  '/models/env/rock-medium-2.glb',
  '/models/env/rock-medium-3.glb',
  '/models/env/rockpath-square-wide.glb',
  '/models/env/barrel.glb',
  '/models/env/cardboard-box.glb',
  '/models/env/barrier.glb',
  '/models/env/trash-can.glb',
]
ENV_URLS.forEach((u) => useGLTF.preload(u))

/** deterministik pseudo-random */
function prand(i: number, salt = 1): number {
  const v = Math.sin(i * 127.1 * salt + 311.7) * 43758.5453
  return v - Math.floor(v)
}

function Ground() {
  const [colorMap, normalMap] = useTexture([
    '/textures/grass_color.jpg',
    '/textures/grass_normal.jpg',
  ])
  const gl = useThree((s) => s.gl)
  useMemo(() => {
    for (const t of [colorMap, normalMap]) {
      t.wrapS = THREE.RepeatWrapping
      t.wrapT = THREE.RepeatWrapping
      t.repeat.set(22, 26)
    }
    colorMap.colorSpace = THREE.SRGBColorSpace
    const aniso = Math.min(8, gl.capabilities.getMaxAnisotropy())
    colorMap.anisotropy = aniso
    normalMap.anisotropy = aniso
  }, [colorMap, normalMap, gl])
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -7]} receiveShadow>
      <planeGeometry args={[46, 52]} />
      <meshStandardMaterial map={colorMap} normalMap={normalMap} normalScale={new THREE.Vector2(0.7, 0.7)} roughness={0.95} />
    </mesh>
  )
}

function RangeEnvironment() {
  // arka orman duvarı: çamlar
  const backForest = useMemo(() => {
    const arr: { x: number; z: number; s: number; ry: number; url: string }[] = []
    let i = 0
    for (let x = -17; x <= 17; x += 3.1) {
      const j = prand(i)
      arr.push({
        x: x + (j - 0.5) * 2.2,
        z: -25 - prand(i, 2) * 6,
        s: 4.2 + prand(i, 3) * 1.8,
        ry: prand(i, 4) * Math.PI * 2,
        url: `/models/env/pine-${1 + (i % 5)}.glb`,
      })
      i++
    }
    return arr
  }, [])

  // yan ağaçlar: yapraklı + karakter ağaçları
  const sideTrees = useMemo(
    () => [
      { url: '/models/env/commontree-1.glb', x: -7.6, z: -9, s: 3.4, ry: 0.4 },
      { url: '/models/env/commontree-3.glb', x: 8.4, z: -11, s: 3.8, ry: 1.9 },
      { url: '/models/env/commontree-2.glb', x: -9.2, z: -16, s: 3.6, ry: 2.7 },
      { url: '/models/env/commontree-5.glb', x: 9.6, z: -18, s: 3.5, ry: 0.9 },
      { url: '/models/env/commontree-4.glb', x: -6.8, z: -20, s: 3.7, ry: 1.4 },
      { url: '/models/env/commontree-2.glb', x: 7.4, z: -5, s: 3.0, ry: 3.6 },
      { url: '/models/env/commontree-1.glb', x: 11.5, z: -13, s: 3.6, ry: 2.2 },
      { url: '/models/env/commontree-3.glb', x: -11.8, z: -7, s: 3.3, ry: 5.0 },
      { url: '/models/env/twistedtree-1.glb', x: -10.5, z: -22, s: 3.8, ry: 1.1 },
      { url: '/models/env/deadtree-1.glb', x: 12.2, z: -21, s: 3.2, ry: 0.7 },
      { url: '/models/env/deadtree-2.glb', x: -13.5, z: -13, s: 3.0, ry: 2.9 },
      { url: '/models/env/commontree-4.glb', x: 13.8, z: -8, s: 3.4, ry: 4.2 },
    ],
    []
  )

  // çalılar + çiçekler (yeşil çalı çeşitleri)
  const bushes = useMemo(
    () => [
      { x: -4.9, z: -6.5, s: 1.0, k: 'fern' },
      { x: 5.2, z: -8, s: 1.1, k: 'flower' },
      { x: -5.8, z: -12.5, s: 1.2, k: 'plant' },
      { x: 6.1, z: -14, s: 0.9, k: 'fern' },
      { x: 4.4, z: -3.8, s: 0.8, k: 'flower' },
      { x: -4.2, z: -2.9, s: 0.8, k: 'plant' },
      { x: -6.6, z: -18.5, s: 1.3, k: 'fern' },
      { x: 7.0, z: -20, s: 1.1, k: 'flower' },
      { x: 8.6, z: -16, s: 1.0, k: 'plant' },
      { x: -8.9, z: -10.5, s: 1.05, k: 'plant' },
    ],
    []
  )

  const bushUrl = (k: string) =>
    k === 'flower'
      ? '/models/env/bush-common-flowers.glb'
      : k === 'fern'
        ? '/models/env/fern.glb'
        : '/models/env/plant-1-big.glb'

  // çim öbekleri + çiçekler saha içine serpilir
  const tufts = useMemo(() => {
    const arr: { x: number; z: number; s: number; url: string; ry: number }[] = []
    for (let i = 0; i < 26; i++) {
      const kind = prand(i, 5)
      arr.push({
        x: (prand(i) - 0.5) * 17,
        z: -2 - prand(i, 2) * 19,
        s: 0.55 + kind * 0.5,
        ry: prand(i, 3) * Math.PI * 2,
        url:
          kind < 0.4
            ? '/models/env/grass-common-tall.glb'
            : kind < 0.7
              ? '/models/env/grass-wispy-tall.glb'
              : kind < 0.85
                ? '/models/env/flower-3-group.glb'
                : '/models/env/flower-4-group.glb',
      })
    }
    return arr
  }, [])

  // kayalar
  const rocks = useMemo(
    () => [
      { x: -3.6, z: -15.5, s: 0.75, url: '/models/env/rock-medium-1.glb', ry: 0.4 },
      { x: 4.7, z: -11.5, s: 0.55, url: '/models/env/rock-medium-2.glb', ry: 1.8 },
      { x: 2.9, z: -19, s: 0.9, url: '/models/env/rock-medium-3.glb', ry: 2.6 },
      { x: -8.2, z: -4.5, s: 0.6, url: '/models/env/rock-medium-2.glb', ry: 4.1 },
    ],
    []
  )

  return (
    <group>
      <Ground />
      {/* atış şeritleri — çim üzerinde soluk beyaz */}
      {[-1.8, 0, 1.8].map((x) => (
        <mesh key={x} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.01, -6]}>
          <planeGeometry args={[0.07, 15]} />
          <meshStandardMaterial color="#e8e4d0" roughness={0.9} />
        </mesh>
      ))}
      {/* atış hattı taş patika */}
      {[-0.55, 0.55].map((x) => (
        <NatureProp key={`p${x}`} url="/models/env/rockpath-square-wide.glb" x={x} z={0.3} s={0.95} ry={0.1 * x} y={0.02} />
      ))}
      {/* atış hattı props: variller, kutular, bariyer, çöp kutusu */}
      <NatureProp url="/models/env/barrel.glb" x={-3.1} z={-1.4} s={1.15} ry={0.3} />
      <NatureProp url="/models/env/barrel.glb" x={-2.55} z={-1.75} s={1.15} ry={1.7} />
      <NatureProp url="/models/env/barrel.glb" x={-2.85} z={-1.55} s={1.15} ry={0.9} y={0.62} />
      <NatureProp url="/models/env/cardboard-box.glb" x={3.3} z={-2.2} s={0.9} ry={0.5} />
      <NatureProp url="/models/env/cardboard-box.glb" x={3.75} z={-1.8} s={0.7} ry={1.2} y={0.42} />
      <NatureProp url="/models/env/barrier.glb" x={-4.6} z={-4.2} s={1.6} ry={0.12} />
      <NatureProp url="/models/env/barrier.glb" x={4.9} z={-4.8} s={1.6} ry={-0.15} />
      <NatureProp url="/models/env/trash-can.glb" x={-2.4} z={-0.6} s={0.95} ry={2.1} />

      {/* arka orman duvarı */}
      {backForest.map((t, i) => (
        <NatureProp key={`b${i}`} url={t.url} x={t.x} z={t.z} s={t.s} ry={t.ry} />
      ))}
      {/* yan ağaçlar */}
      {sideTrees.map((t, i) => (
        <NatureProp key={`s${i}`} url={t.url} x={t.x} z={t.z} s={t.s} ry={t.ry} />
      ))}
      {/* çalılar */}
      {bushes.map((b, i) => (
        <NatureProp
          key={`bu${i}`}
          url={bushUrl(b.k)}
          x={b.x}
          z={b.z}
          s={b.s}
          ry={prand(i, 6) * Math.PI * 2}
        />
      ))}
      {/* çim + çiçek öbekleri */}
      {tufts.map((g, i) => (
        <NatureProp key={`g${i}`} url={g.url} x={g.x} z={g.z} s={g.s} ry={g.ry} />
      ))}
      {/* kayalar */}
      {rocks.map((r, i) => (
        <NatureProp key={`r${i}`} url={r.url} x={r.x} z={r.z} s={r.s} ry={r.ry} />
      ))}
    </group>
  )
}

/** Gradient gök kubbesi: zenitte mavi, ufukta sisle uyumlu açık ton — patlama yok */
function SkyDome() {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        uniforms: {
          zenith: { value: new THREE.Color('#3d7ab8') },
          horizon: { value: new THREE.Color('#cfe2f2') },
        },
        vertexShader: /* glsl */ `
          varying vec3 vDir;
          void main() {
            vDir = normalize(position);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          uniform vec3 zenith;
          uniform vec3 horizon;
          varying vec3 vDir;
          void main() {
            float h = max(vDir.y, 0.0);
            // ufukta yumuşak, zenitte doygun mavi
            vec3 col = mix(horizon, zenith, pow(h, 0.62));
            gl_FragColor = vec4(col, 1.0);
          }
        `,
      }),
    []
  )
  return (
    <mesh material={mat} renderOrder={-1}>
      <sphereGeometry args={[180, 24, 16]} />
    </mesh>
  )
}

/**
 * Ufuk fon planı: prosedürel low-poly dağ/orman silüeti (CanvasTexture, deterministik).
 * Arka orman duvarının ardına yerleşir; sis uzaklık hissini güçlendirir, boş gökyüzünü doldurur.
 */
function BackdropPlate() {
  const tex = useMemo(() => {
    const W = 2048
    const H = 512
    const cv = document.createElement('canvas')
    cv.width = W
    cv.height = H
    const ctx = cv.getContext('2d')!
    ctx.clearRect(0, 0, W, H)

    // bulutlar (tepe bölge)
    ctx.fillStyle = 'rgba(255,255,255,0.9)'
    for (let i = 0; i < 9; i++) {
      const cx = prand(i, 3) * W
      const cy = H * (0.06 + prand(i, 4) * 0.16)
      const cw = W * (0.05 + prand(i, 5) * 0.08)
      const ch = H * (0.05 + prand(i, 6) * 0.05)
      ctx.beginPath()
      ctx.ellipse(cx, cy, cw / 2, ch / 2, 0, 0, Math.PI * 2)
      ctx.ellipse(cx + cw * 0.22, cy - ch * 0.35, cw / 3, ch / 2.4, 0, 0, Math.PI * 2)
      ctx.ellipse(cx - cw * 0.22, cy - ch * 0.18, cw / 3.2, ch / 2.8, 0, 0, Math.PI * 2)
      ctx.fill()
    }

    // silüet katmanları: taban çizgisinden aşağıya dolgu
    const ridge = (base: number, amp: number, step: number, salt: number, color: string) => {
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.moveTo(0, H)
      for (let x = 0; x <= W; x += step) {
        const n = prand(x / step, salt)
        const n2 = prand(x / step, salt + 9)
        ctx.lineTo(x, base - (n * 0.65 + n2 * 0.35) * amp)
      }
      ctx.lineTo(W, H)
      ctx.closePath()
      ctx.fill()
    }
    ridge(H * 0.42, H * 0.3, 128, 1, '#9db4cc') // uzak dağlar
    ridge(H * 0.58, H * 0.2, 96, 2, '#7e9c8c') // orta tepeler
    ridge(H * 0.72, H * 0.14, 64, 3, '#527355') // yakın treeline (daha koyu, net okunur)

    // altta sis rengine erime (zeminle kaynaşır)
    const g = ctx.createLinearGradient(0, H * 0.8, 0, H)
    g.addColorStop(0, 'rgba(185,214,238,0)')
    g.addColorStop(1, 'rgba(185,214,238,1)')
    ctx.fillStyle = g
    ctx.fillRect(0, H * 0.8, W, H * 0.2)

    const t = new THREE.CanvasTexture(cv)
    t.colorSpace = THREE.SRGBColorSpace
    return t
  }, [])

  return (
    <mesh position={[0, 13, -42]} renderOrder={-1}>
      <planeGeometry args={[170, 42.5]} />
      <meshBasicMaterial map={tex} transparent depthWrite={false} />
    </mesh>
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
  shotSignal,
  reloadSignal,
  aimRef,
  joystickVec,
  joystickActive,
  onHit,
  onMiss,
  onEscape,
}: RangeSceneProps) {
  const [targets, setTargets] = useState<TargetData[]>([])
  const [sparks, setSparks] = useState<Spark[]>([])
  const [tracers, setTracers] = useState<TracerData[]>([])
  const targetsRef = useRef<TargetData[]>([])
  targetsRef.current = targets
  // test qancyası: bot playtest hedefleri okuyup nişan alabilir
  useEffect(() => {
    ;(window as unknown as Record<string, unknown>).__rangeTargets = targetsRef
  }, [])

  // atış: gun'un baktığı yönde raycast — hedef küre çarpışması
  const handleShoot = useCallback(
    (origin: THREE.Vector3, dir: THREE.Vector3) => {
      if (!active) return
      ;(window as unknown as Record<string, unknown>).__lastShot = {
        origin: origin.toArray(),
        dir: dir.toArray(),
        aim: [aimRef.current.x, aimRef.current.y],
        targets: targetsRef.current.map((t) => ({ id: t.id, x: t.x, y: t.y, z: t.z })),
      }
      let best: { id: number; t: number; pos: THREE.Vector3 } | null = null
      for (const t of targetsRef.current) {
        const tt = raySphere(origin, dir, new THREE.Vector3(t.x, t.y, t.z), 0.5)
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
      onCreated={({ gl }) => {
        ;(window as unknown as Record<string, unknown>).__glInfo = gl.info
      }}
    >
      <color attach="background" args={[0xa9cde8]} />
      <fog attach="fog" args={[0xb9d6ee, 26, 62]} />

      <Suspense fallback={null}>
        <CameraFit />
        <Spawner active={active} setTargets={setTargets} />
        <TargetLifecycle
          active={active}
          targetsRef={targetsRef}
          setTargets={setTargets}
          onEscape={onEscape}
        />
        {/* gradient gök kubbesi: ufuk sisle uyumlu, patlamaz */}
        <SkyDome />
        {/* dağ/orman ufuk fonu: boş gökyüzünü doldurur */}
        <BackdropPlate />
        <hemisphereLight intensity={0.85} groundColor={0x4a6a35} />
        <directionalLight position={[6, 9, 3]} intensity={2.6} color="#fff2d8" />
        <directionalLight position={[-6, 4, -4]} intensity={0.7} color="#cfe5ff" />

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
          <PanelTarget key={t.id} data={t} active={active} />
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
