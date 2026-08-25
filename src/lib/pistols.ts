export interface Pistol {
  id: string
  name: string
  nickname: string
  model: string
  description: string
  stats: { label: string; value: number }[]
  caliber: string
  role: string
  /** Namlu yönü (modelin kendi ekseninde): 1 = +X, -1 = -X */
  muzzle: 1 | -1
  /** GLB içinde 'Fire' animasyonu var mı */
  animated?: boolean
}

export const PISTOLS: Pistol[] = [
  {
    id: 'colt_m1911',
    name: 'Colt M1911',
    nickname: 'The Classic',
    model: '/models/colt_m1911.glb',
    description:
      'Bir asrın klasiği. Ceviz kabzalar, çelik gövde ve zamana meydan okuyan sadelik. Cephanelikte tıkla, ateş etsin.',
    stats: [
      { label: 'Hasar', value: 78 },
      { label: 'Atış Hızı', value: 48 },
      { label: 'Şarjör', value: 40 },
      { label: 'Kontrol', value: 70 },
    ],
    caliber: '.45 ACP',
    role: 'Old School',
    muzzle: -1,
    animated: true,
  },
  {
    id: 'pistol2011',
    name: 'STI 2011',
    nickname: 'The Showstopper',
    model: '/models/pistol.glb',
    description:
      'Yarış sahnesinin yıldızı: altın detaylı 2011 platformu. Hızlı şarjör değişimi, keskin takip atışları, sahnede göz alıcı duruş.',
    stats: [
      { label: 'Hasar', value: 70 },
      { label: 'Atış Hızı', value: 85 },
      { label: 'Şarjör', value: 95 },
      { label: 'Kontrol', value: 78 },
    ],
    caliber: '.38 Super',
    role: 'Race Gun',
    muzzle: -1,
  },
  {
    id: 'glock17',
    name: 'Glock 17',
    nickname: 'The Workhorse',
    model: '/models/9mm_pistol.glb',
    description:
      'Güvenilirlik derse, örnek gösterilir. Sade, sağlam ve bitmeyen dayanıklılık. Yeni başlayanların ilk aşkı, veteranların yedeği.',
    stats: [
      { label: 'Hasar', value: 60 },
      { label: 'Atış Hızı', value: 65 },
      { label: 'Şarjör', value: 85 },
      { label: 'Kontrol', value: 82 },
    ],
    caliber: '9x19mm',
    role: 'Standard',
    muzzle: -1,
  },
]
