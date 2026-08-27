# Pistol Vibe — Sadece Tabanca

A.T.A Pistol Team (Pistol Vibe) ekibinin tek sayfalık tanıtım sitesi. React + Vite + Tailwind + shadcn/ui frontend.

## Yerelde Çalıştırma

```bash
npm install
npm run dev        # site: http://localhost:5173, API: http://localhost:3001 (server/ klasöründeki Express, JSON dosyasına yazar)
```

Admin paneli: `http://localhost:5173/admin` (yerelde) veya `https://<domain>/admin` (prod). Şifre `ADMIN_PASSWORD` ortam değişkenindedir.

## Admin Paneli Neler Yönetebilir?

- **Başvurular** — listeleme ve silme
- **Yorumlar** — düzenleme, silme
- **Skorlar** — ekleme, düzenleme, silme (manuel "efsanevi skor" girişi dahil)
- **Galeri** — fotoğraf yükleme (Vercel Blob), açıklama, kaldırma
- **İstatistikler** — Rakamlarla bölümündeki değerler/etiketler
- **Cephanelik** — tabanca ekle/düzenle/sil (+ ürün bağlantısı)

İstatistikler, cephanelik ve galeri Redis'te tek `content` dokümanında tutulur; admin hiçbir şey kaydetmemişse site varsayılan değerlerle çalışır.

## Vercel Ortam Değişkenleri

| Değişken | Açıklama |
|----------|----------|
| `REDIS_URL` | Redis bağlantısı (zorunlu) |
| `ADMIN_PASSWORD` | Admin paneli şifresi (zorunlu) |
| `BLOB_READ_WRITE_TOKEN` | Galeri fotoğraf yüklemeleri için — Vercel Dashboard → Storage → Blob store oluştur ve projeye bağla (yoksa yükleme 501 döner, diğer özellikler çalışır) |

## Proje Yapısı

```
api/            Vercel serverless fonksiyonları (Vercel Redis + Blob ile kalıcı)
server/         Yerel geliştirme için Express (dosya tabanlı; fotoğraflar server/data/uploads/)
src/admin/      Admin paneli sekmeleri (Başvurular, Yorumlar, Skorlar, Galeri, İstatistikler, Cephanelik)
src/components/ Sayfa bölümleri (Hero, ApplicationForm, Gallery, Sponsors, Comments, Footer)
public/assets/  Logo ve tabanca görselleri
```
