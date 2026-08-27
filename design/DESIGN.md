# DESIGN.md — Pistolvibe stil sözleşmesi

> `edit` rotası önce bunu okur. Kaynak: auteur phase 4. Değişiklikler bu token'lara uymak zorunda.

## Token'lar
- **Zemin:** `#0b0b0e` (OKLCH L≈0.13 — gece arena; `auteur-allow: HOUSE_TELL_1`, marka kararı)
- **Marka hue:** altın `#d4af37` (oklch ≈ 0.78 0.13 85); düz metin vurgusu `#e8bf4d`; dim `#a8811f`
- **İnk:** `#e8e6df` · muted `#b9b5aa` · hairline `rgba(212,175,55,0.35)`
- **Yasak:** gradient text (background-clip) — tüm başlıklar tek renk; mor-mavi gradyan; `transition: all`; scroll listener (GSAP ScrollTrigger kullan)

## Tip sistemi
- Display: **Russo One** (uppercase, tracking −0.02em, leading 0.98)
- Metin: **Chakra Petch** (body 1.5–1.55)
- Hero H1 clamp(40px, 6vw, 88px) — tip destek katman, sahne özne (product-as-hero)

## Motion sözlüğü (≤3 aile — yeni aile ekleme)
1. **scroll-scrub** — hero pin'li kamera dolly (tek wow; scrub smoothing 0.5)
2. **parallax-depth** — hero pointer parallax (w=0.07, sahne ilerledikçe azalır)
3. **entrance-reveal** — SplitText char girişleri, CTA rampaları (stagger 40–45ms)
- Her UI geçişi ease-out; süre tabloları motion.md. `prefers-reduced-motion` → pin/scrub yok, zengin tek kare + statik CTA.

## Bölüm açılış desenleri
- Hero: split-asymmetric (yazı sağ, nesne sol, viewport taşması)
- Arena/Form: mevcut SectionHeading sistemi (kicker + başlık) — auteur eyebrow ban'ine takılmaz çünkü marka sistemi bu tek desenle sınırlı ve sıklığı düşük... (not: yeni bölümlerde açılışı değiştir: hairline kuralı veya tam-bleed bant)

## Projenin kendi ek yasakları
- Skinned GLB clone: daima `SkeletonUtils.clone` (düz clone bind-pose bozuyor)
- `colt_1911.glb` içindeki CINEMA_4D_Main klibi modeli taşır — mixer ile OYNATMA; scroll-bağlı Y turntable kullan
- Yeni WebGL context ekleme — hero tek context; sahne eklemeleri mevcut Canvas içinde
- Tam-ekran post-process (bloom/DoF/grain) yasak — bütçe motion.md tablosu
- Türkçe kopyada Kiril karakterler (а/е/о) yasak — kopya yazımından sonra `[\u0400-\u04FF]` taraması yap
