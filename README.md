# Pistol Vibe — Sadece Tabanca

A.T.A Pistol Team (Pistol Vibe) ekibinin tek sayfalık tanıtım sitesi. React + Vite + Tailwind + shadcn/ui frontend.

## Yerelde Çalıştırma

```bash
npm install
npm run dev        # site: http://localhost:5173, API: http://localhost:3001 (server/ klasöründeki Express, JSON dosyasına yazar)
```

## Proje Yapısı

```
api/            Vercel serverless fonksiyonları (Vercel Redis ile kalıcı)
server/         Yerel geliştirme için Express (dosya tabanlı)
src/components/ Sayfa bölümleri (Hero, ApplicationForm, Gallery, Sponsors, Comments, Footer)
src/assets/gallery/  Galeri fotoğrafları (build-time)
public/assets/  Logo ve tabanca görselleri
```
