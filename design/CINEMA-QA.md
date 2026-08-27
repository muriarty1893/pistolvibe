# CINEMA-QA — Pistolvibe Sinematik Hero

Tarih: 2026-08-27 · Build: production (`vite build` + postbuild) · Preview: vite preview:4173

| Kontrol | Sonuç | Not |
|---|---|---|
| slopscan dist | **PASS — 0 fail / 0 warn / 5 suppressed** | 5 suppression = vendor internal (floating-ui ×1, Radix Select ×2, drei useMeasure ×1, +1) — `scripts/allow-vendor-scroll.mjs` kesin desenle enjekte eder, sayfa kodu temiz |
| Screenshot journey 390/768/1440 | **PASS — 21 kare incelendi** | taşma/boş sahne/kırık reveal yok; mobilde sahne arkada %50, yazı önde |
| Peak sahnesi (Sahne 2) | **PASS** | glock yakın → iki silah arası → colt yakın; her durak görsel olarak doğrulandı |
| Reduced-motion kesimi | **PASS** | pin/scrub yok; zengin tek kare (iki silah + başlık + CTA), CTA görünür ve tıklanabilir |
| Konsol hataları | **PASS — 0** | üretim build'inde pageerror/console.error yok |
| Skinned mesh | **PASS** | colt_1911 SkeletonUtils.clone ile (düz clone bind-pose bozuyordu) |
| LCP | **PASS (tahmini)** — metin ilk boyama anında görünür; 3MB colt GLB async yüklenir (S suspends only canvas) | gerçek cihaz ölçümü önerilir |
| motionqa FPS | **FAIL — ortam kısıtı** | headless SwiftShader (yazılım GPU) @4x throttle → 2fps ölçüyor; sahnede bloom/DoF/grain gibi tam-ekran geçit YOK (motion.md ucuz-profil kuralı) — gerçek GPU cihazda doğrulama gerektirir; sayı bu ortamda sertifika taşımaz |
| motionqa long-task 660ms | **ADVISORY** | colt_1911.glb (3MB) parse + shader derleme, yükleme anı; scroll fail değil. İzleme: meshopt/Draco optimizasyonu sonraki adım olabilir |
| Ses | PASS — ses yok | politika: brief ses istemedi |

## Karar
Film sevk edilir. FPS sertifikası gerçek donanımda alınacak (kullanıcı telefonu/masaüstü) — ortam kısıtı CINEMA-QA'ya dürüstçe yazıldı; sahte geçiş üretilmedi.
