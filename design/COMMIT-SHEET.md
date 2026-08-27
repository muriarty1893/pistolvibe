# COMMIT-SHEET — Pistolvibe Sinematik Hero

> Yedi karar, ilk kod satırından önce. Kaynak: auteur SKILL.md; bu sayfa kod öncesi kilitlenir.

## 1. Peak / Signature
Peak = Sahne 2: **colt_1911 ile glock arasında, pin'li 300vh boyunca scroll'la sürülen kamera geçişi** — silahlar sahnede durur, kamera sinema dolly'si gibi aralarından geçer; colt'ın kendi turntable animasyonu scrub'a bağlı akar.

## 2. Color
`oklch(0.78 0.13 85)` altın (#d4af37) — tier: **committed** (altın vurgular ~%30, sahne koyu). Lacivert-değil: altın mevcut A.T.A logosu/UI'ından alınmış marka kimliği; krem-değil: sahne karanlık CQB arenası. **Arka plan ışıklığı: hedef ortalama L ≈ 0.13** (#0b0b0e tüneli; sahne "gece atışı" — silah metali ancak karanlıkta altın rim taşır).

`auteur-allow: HOUSE_TELL_1` — near-black zemin: marka zaten tüm ürün boyunca koyu (logo, oyun, tablo); dram burada silahın çeliğinde, altın rimde.
`auteur-allow: HOUSE_TELL_5` — altın ≈ hue 85 sarı-turuncu, "acid" değil; marka rengi bu.

## 3. Type
Display: **Russo One** (geniş, askeri-sportif geometrik) / Metin: **Chakra Petch** (teknik humanist). Eksen: ağır geometrik display × mekanik gövde. Inter reddedildi — 2024–26 defaultu. Russo One mevcut logoyla aynı ses.

## 4. Grid break
Hero'da **silah kadrajı sınırları aşıyor**: glock, split-asymmetric yerleşimde sol kolon dışına (viewport kenarına) taşarak kesilir; Sahne 2'de kamera iki silah ARASINDAN geçtiği için kompozisyon tam-bleed, grid hiç yok. Sahne 3'te CTA hizasında tek hairline (1px altın) tam genişlik — contained bölümler arası full-bleed kesme.

## 5. Motion budget
1. **scroll-scrub** — pin'li Sahne 2 kamera dolly (tek wow)
2. **parallax-depth** — Sahne 1'de pointer parallax + yazı katmanı farklı hız
3. **entrance-reveal** — Sahne 3 tip/CTA tek kez yükselir
Başka scroll-tetikli animasyon yok. Marquee yok.

## 6. Reflex check
a) "Airsoft/taktik ekip sitesi yap" denince AI çıktısı: siyah zemin + neon yeşil/kızıl vurgu + taktik stencil font + grid kırık "operator" estetiği, IPSC hedef döngüsü.
b) (a)'dan kaçınan AI: açık zemin "editorial" + serifsiz minimal + havadan çekim ürün fotoğrafı.
c) Bizim sapmamız: **müzayede salonu karanlığı** — iki silah müze vitrininde gerçek ışıkla (key + altın rim + zemin yansıması) durur; kamera filmin konusu olur; tipografi ikincil katman. Kıyafet/nişangâh klişesi yok; "operator" stencil yok.

## 7. House tells broken (auteur'ün kendi refleksleri)
1. **Glow-as-depth → gerçek ışık**: emissive bloom yerine WebGL sahnede yönlü key light + altın rim + zemin yansıması; ışığın yönü, düşüşü ve gölgesi gerçek. (taste §2.5-#7)
2. **Wordmark-as-hero → product-as-hero**: dev "SADECE TABANCA" artık doldurucu değil; sinematik nesne (silah + kamera) sahne öznesi, tipografi destek katman. (taste §2.5-#6)

Ayrıca bilinçli sürülen: scroll-instruction footer + 01/05 sayacı **yok** (§2.5-#4).
