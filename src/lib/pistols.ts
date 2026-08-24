export interface Pistol {
  id: string
  name: string
  nickname: string
  model: string
  description: string
  stats: { label: string; value: number }[]
  caliber: string
  role: string
}

export const PISTOLS: Pistol[] = [
  {
    id: 'glock18c',
    name: 'Glock 18C',
    nickname: 'The Ripper',
    model: '/models/glock18c.glb',
    description:
      'Otomatik ateşleme yeteneğiyle CQB’nin kralı. Yakın mesafede kimse seninle başa çıkamaz — tek şart: kontrol.',
    stats: [
      { label: 'Hasar', value: 62 },
      { label: 'Atış Hızı', value: 98 },
      { label: 'Şarjör', value: 80 },
      { label: 'Kontrol', value: 45 },
    ],
    caliber: '9x19mm',
    role: 'CQB Sprint',
  },
  {
    id: 'deagle',
    name: 'Desert Eagle',
    nickname: 'The Hand Cannon',
    model: '/models/deagle.glb',
    description:
      'El tabancası mı, top mu? Tek atışta mesaj belli. Sabır ve soğukkanlılık gerektirir — ödülü ise muazzam.',
    stats: [
      { label: 'Hasar', value: 98 },
      { label: 'Atış Hızı', value: 30 },
      { label: 'Şarjör', value: 35 },
      { label: 'Kontrol', value: 40 },
    ],
    caliber: '.50 AE',
    role: 'One Tap',
  },
  {
    id: 'm1911',
    name: 'M1911',
    nickname: 'The Classic',
    model: '/models/m1911.glb',
    description:
      'Bir asrın klasiği. Ceviz kabzalar, çelik gövde ve zamana meydan okuyan sadelik. Saflığın ta kendisi.',
    stats: [
      { label: 'Hasar', value: 78 },
      { label: 'Atış Hızı', value: 48 },
      { label: 'Şarjör', value: 40 },
      { label: 'Kontrol', value: 70 },
    ],
    caliber: '.45 ACP',
    role: 'Old School',
  },
  {
    id: 'sigp320',
    name: 'SIG P320',
    nickname: 'The Modular',
    model: '/models/sigp320.glb',
    description:
      'Modern modüler tasarım, dengeli kontrol ve hızlı takip atışları. Turnuva sahasının sessiz favorisi.',
    stats: [
      { label: 'Hasar', value: 65 },
      { label: 'Atış Hızı', value: 72 },
      { label: 'Şarjör', value: 75 },
      { label: 'Kontrol', value: 85 },
    ],
    caliber: '9x19mm',
    role: 'Tournament',
  },
]
