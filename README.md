# Pistol Vibe — Sadece Tabanca

A.T.A Pistol Team (Pistol Vibe) ekibinin tek sayfalık tanıtım sitesi. React + Vite + Tailwind + shadcn/ui frontend; yorum ve başvuru verileri Vercel Redis üzerinde saklanır.

## Yerelde Çalıştırma

```bash
npm install
npm run dev        # site: http://localhost:5173, API: http://localhost:3001 (server/ klasöründeki Express, JSON dosyasına yazar)
```

## Vercel'e Deploy (ücretsiz)

1. Projeyi GitHub'a push et (`git init`, ilk commit, repo oluştur, push).
2. [vercel.com](https://vercel.com) → **Add New Project** → repo'yu seç. Framework olarak **Vite** otomatik algılanır, ayar değiştirmeye gerek yok.
3. **Storage** sekmesi → **Create Database** → **Redis** (Official Redis for Vercel) → ücretsiz (Free) planla oluştur → projene **Connect** et. Ortam değişkeni `REDIS_URL` otomatik eklenir. (Custom Prefix kutusunu boş bırak.)
4. **Deploy** (Redis'i sonradan bağladıysan bir kez **Redeploy**).

Bu kadar. `api/comments.ts` ve `api/applications.ts` otomatik olarak serverless fonksiyonlara dönüşür; yorumlar ve başvurular Redis'te kalıcı saklanır.

> Not: `vercel dev` komutu (Vercel CLI ile) serverless fonksiyonları ve Redis'i yerelde de çalıştırır. `npm run dev` ise Vercel'siz geliştirme içindir (dosya tabanlı Express).

## Galeriye Fotoğraf Ekleme

Fotoğrafı `src/assets/gallery/` klasörüne at (png/jpg/webp/avif), commit'le, push'la. Build sırasında otomatik eklenir — kod değişikliği gerekmez.

## Yorum / Başvuru Verilerine Erişim

Vercel dashboard → **Storage** → Redis veritabanın → **Data Browser**: `comments` ve `applications` listelerinde tüm kayıtlar görülebilir.

## Admin Paneli

`/admin` adresinde şifre korumalı yönetim paneli var: başvuruları ve yorumları görüntüleme + tek tıkla silme.

Kurulum:
1. Vercel dashboard → proje → **Settings → Environment Variables** → `ADMIN_PASSWORD` ekle (güçlü bir şifre seç, örn. `openssl rand -base64 18` çıktısı).
2. Bir kez **Redeploy** yap.
3. `https://<site-adresin>/admin` → şifreyi gir.

Panel ana siteden linklenmez; adresi sadece ekibe söyle.

## Proje Yapısı

```
api/            Vercel serverless fonksiyonları (Vercel Redis ile kalıcı)
server/         Yerel geliştirme için Express (dosya tabanlı)
src/components/ Sayfa bölümleri (Hero, ApplicationForm, Gallery, Sponsors, Comments, Footer)
src/assets/gallery/  Galeri fotoğrafları (build-time)
public/assets/  Logo ve tabanca görselleri
```
