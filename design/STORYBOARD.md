# STORYBOARD — Pistolvibe Sinematik Hero

## Film meta
- **Product:** A.T.A Pistol Team — Adana merkezli, sadece tabanca oynayan airsoft takımı (landing + mevcut uygulama: arena oyunu, tablo, başvuru)
- **Audience:** Airsopecial ilgilenen genç yetişkinler; takıma katılmayı ya da rekabetçi oyunu düşünen yerli oyuncular
- **The one feeling:** **gerilim + saygı** ("bu takım ciddi, burada sadece tabanca var")
- **Peak scene:** Sahne 2 — iki tabanca arasında scroll'la süpürülen kamera geçişi (intensity 8)
- **Assets available up front:** 3D: `public/models/colt_1911.glb` (3MB, CINEMA_4D_Main animasyonlu), `9mm_pistol.glb` (glock; 2 mesh, animasyonsuz); env: varil/bariyer GLB'leri; hiç video/fotoğraf yok
- **Sourced-asset findings:** colt_1911'in tek animasyon klibi var (CINEMA_4D_Main) — turntable/keşif hareketi olarak scroll-scrub ile senkronlanabilir; glock animasyonsuz — statik poz + kamera hareketi taşır; her iki model de tek materyal/grup — malzeme değişimi (altın rim) kolay
- **Assumptions made:** Marka dili kullanıcı kararıyla sabitlendi: koyu zemin + altın (#d4af37), Russo One + Chakra Petch. Hero dışı bölümler (arena, tablo, başvuru) aynen kalır — film sadece hero bandında (≈300vh) oynar. Ağ yoksa recon atlanır (skill izinli).
- **References taken:** recon atlandı (ağ primi + kullanıcı kararı); mekanik kaynağı auteur'ün kendi tarifleri: scroll-cinema.md — GSAP ScrollTrigger pin + scrub kamera
- **Moodboard read:** atlandı — palet mevcut markadan: altın tek hue, koyu sahne; kaçınılan: mavi-mor gradyan ve neon yeşil
- **Style gate verdict:** approved — mockup 1440/390 onaylandı, slopscan 0/0/0; token'lar (`--bg #0b0b0e`, `--gold #d4af37`, Russo One/Chakra Petch, hairline `rgba(212,175,55,.35)`) projeye aynen taşındı

## Arc — hero bandı (sayfanın geri kalanı mevcut uygulama)

| # | Scene | Beat | Intensity | layout family | motion family |
|---|-------|------|-----------|---------------|---------------|
| 1 | Sahnede Glock | hook | 6 | split-asymmetric | parallax-depth |
| 2 | İki Tabanca Arası | peak | 8 | pinned-canvas | scroll-scrub |
| 3 | Kanıtla | door | 4 | centred-type | entrance-reveal |

Motion families toplam: 3 (parallax-depth, scroll-scrub, entrance-reveal) — bütçeye uygun. Komşu sahneler ailede farklı.

---

### Scene 1 — Sahnede Glock | beat: hook | intensity: 6
- **purpose:** feel: "bu bir tabanca sitesi, ciddi" / learn: A.T.A = sadece tabanca airsoft takımı
- **subject:** glock (9mm_pistol.glb) — koyu stüdyo sahnesinde tek nesne
- **layout_family / motion_family:** split-asymmetric / parallax-depth
- **camera:** low-angle (kahraman açısı), sol üçte birde; hafif sağa süzülme
- **lighting:** hard contrast — tek sert key (sağ üst, sıcak beyaz) + altın rim (sol arka); zemin koyu yansımalı
- **motion:** canvas hafif pointer parallax; yazı katmanı scroll'da farklı hızda kayar (depth)
- **transition_in / out:** cut / letterbox (Sahne 2 pin'ine girerken ince alt bant)
- **scroll_len:** 100vh (hero ekranı)
- **copy:** H: "SADECE TABANCA" / sub: "Tüfek yok, sniper yok. Yakın mesafe — tam konsantrasyon."
- **media:**
  - type: 3D model
  - route: SOURCE (mevcut `public/models/9mm_pistol.glb` — CC0/özel envanter)
  - renderer yönü: koyu materyal, altın rim `(1, 0.72, 0.3)` arka-soldan; zemin yansıması; low-angle kamera
  - score: none
- **fallback:** WebGL yoksa: statik sahne posteri + tipografi aynen okunur

### Scene 2 — İki Tabanca Arası | beat: peak | intensity: 8
- **purpose:** feel: sinematik zirve — "film sahnesi gibi" / learn: takımın iki ana silahı var, bu bir ekip işi
- **subject:** colt_1911 (animasyonlu turntable) solda, glock sağda; kamera ikisinin arasında süpürülür
- **layout_family / motion_family:** pinned-canvas / scroll-scrub
- **camera:** orbital-dolly — scroll progress 0→1: glock yakın açılış → iki silahın arasından geçiş → colt'ın turntable animasyonuna yakınlaşma
- **lighting:** studio + golden rim — altın rim her iki silahta; zemin yansıması; hafif toz hâlesi (particle değil, ışık huzmesi düzlemi)
- **motion:** GSAP ScrollTrigger pin; scroll progress kamera pozisyonu + colt animasyon zamanını sürer (scrub smoothing 0.5)
- **transition_in / out:** letterbox (giriş) / depth-parallax (çıkış: yazı katmanı öne kayar)
- **scroll_len:** 300vh (pinned)
- **copy:** H: "İki mevsim, tek kural" / sub: "Pistol-only CQB. İsabet kasettir, ekip ailedir." + mikro: "A.T.A — Adana"
- **media:**
  - type: 3D model ×2
  - route: SOURCE (mevcut `colt_1911.glb` + `9mm_pistol.glb`)
  - renderer yönü: scroll 0.0=colt yakın plan, 0.5=iki silah arası simetri ekseni, 1.0=glock yakın plan; key sabit, kamera hareket ediyor
  - score: none (ses politikası: kullanıcı istemedi)
- **fallback:** pin'siz tek kare: iki silahın statik kompozisyonu + tipografi

### Scene 3 — Kanıtla | beat: door | intensity: 4
- **purpose:** feel: davet / learn: oyuna ve başvuruya buradan girilir
- **subject:** tipografi + CTA
- **layout_family / motion_family:** centred-type / entrance-reveal
- **camera:** static (dü zemin, bakan kameraya)
- **lighting:** koyu, tek altın vurgu çizgisi (hairline) CTA hizasında
- **motion:** başlık + CTA'lar ScrollTrigger ile tek kez yükselip belirir (stagger 45ms)
- **transition_in / out:** depth-parallax / view-transition yok — mevcut bölüme doğal kesme
- **scroll_len:** content
- **copy:** H: "Refleksini kanıtla" / sub: "Arena açık — Instagram adınla gir, tabloya yazıl." CTA: "Refleksini Test Et" · "Hemen Başvur"
- **media:**
  - type: none (type-led)
  - route: —
  - frame prompt: —
  - score: none
- **fallback:** JS kapalıyken: başlık + iki buton düz metin/href olarak görünür

## Gate 0 checklist
- [x] tek sahne ≥8 (Sahne 2)
- [x] komşu sahneler layout/motion ailesinde farklı
- [x] ≤3 motion family (parallax-depth, scroll-scrub, entrance-reveal)
- [x] her sahnede gerçek Türkçe kopya + fallback var
- [x] her media bloğu dolu — hepsi SOURCE/live-3D, render yönlendirmesi yazılı
- [ ] storyboard onayı (kullanıcı) — mockup gate ile birlikte istenir
