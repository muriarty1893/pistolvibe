# Adana Tactical Airsoft — Sadece Tabanca

Pistol Vibe ekibinin tek sayfalık tanıtım sitesi. React + Vite + Tailwind + shadcn/ui frontend; yorum ve başvuru verileri Vercel KV (Redis) üzerinde saklanır.

## Yerelde Çalıştırma

```bash
npm install
npm run dev        # site: http://localhost:5173, API: http://localhost:3001 (server/ klasöründeki Express, JSON dosyasına yazar)
```

## Vercel'e Deploy (ücretsiz)

1. Projeyi GitHub'a push et (`git init`, ilk commit, repo oluştur, push).
2. [vercel.com](https://vercel.com) → **Add New Project** → repo'yu seç. Framework olarak **Vite** otomatik algılanır, ayar değiştirmeye gerek yok.
3. Deploy'a basmadan önce (veya sonra fark etmez): proje sayfasında **Storage** sekmesi → **Create Database** → **KV** seç → ücretsiz planla oluştur → projeye **Connect** et. Ortam değişkenleri (`KV_REST_API_URL`, `KV_REST_API_TOKEN`) otomatik eklenir.
4. **Deploy** (KV'yi sonradan bağladıysan bir kez **Redeploy**).

Bu kadar. `api/comments.ts` ve `api/applications.ts` otomatik olarak serverless fonksiyonlara dönüşür; yorumlar ve başvurular KV'de kalıcı saklanır.

> Not: `vercel dev` komutu (Vercel CLI ile) serverless fonksiyonları ve KV'yi yerelde de çalıştırır. `npm run dev` ise Vercel'siz geliştirme içindir (dosya tabanlı Express).

## Galeriye Fotoğraf Ekleme

Fotoğrafı `src/assets/gallery/` klasörüne at (png/jpg/webp/avif), commit'le, push'la. Build sırasında otomatik eklenir — kod değişikliği gerekmez.

## Yorum / Başvuru Verilerine Erişim

Vercel dashboard → **Storage** → KV veritabanı → **Data Browser**: `comments` ve `applications` listelerinde tüm kayıtlar görülebilir.

## Proje Yapısı

```
api/            Vercel serverless fonksiyonları (KV ile kalıcı)
server/         Yerel geliştirme için Express (dosya tabanlı)
src/components/ Sayfa bölümleri (Hero, ApplicationForm, Gallery, Sponsors, Comments, Footer)
src/assets/gallery/  Galeri fotoğrafları (build-time)
public/assets/  Logo ve tabanca görselleri
```
