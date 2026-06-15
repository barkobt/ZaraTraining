# Pusula — Durum & Plan (handoff)

> Bu dosya, uzun oturumun "compact"i: ne yapıldı, ne kaldı, nereden yürüyeceğiz.
> Çalışma dizini: `/Users/barko/Desktop/ZaraTraining` · Branch: `feat/pusula-demo`.

## Yapılanlar (commit'li)
1. **People-merkezli platform** (`src/pages/pusula/`): nav (İNSAN·GELİŞİM·SONUÇ, hover-dropdown).
2. **Gerçek roster** (`data-staff.ts`): 30 personel (ShiftOrganizer seed) + türetilen nitel profiller; rol-tipi (Müdür=Sevim, Commercial, Satış Danışmanı) + yaşam-evresi filtreleri.
3. **Gerçek-his chart** (`placement.ts`/`staffing.ts`): tam akşam, yetkinlik yerleşimi, kademeli morph, **kadro+surplus → desteğe yönlendirme**, koçluk-komşuluğu.
4. **Profil**: Pusula okuması + **3 enerji persona** (Approacher/Welcomer/Mix&Match) + alan-spesifik sinyaller + belirsizlik + yokluk≠başarısızlık + KPI.
5. **Gelişim Defteri**: 120 gerçek topic (3 rol×3 seviye), kategori gruplama, tarih+pill-notu, Öğretebilir momenti, Yetkinlik(0–5 etiket)/Dönem Aksiyonu/Raporu (yazılabilir), **Evre Planları** (hover), **Müfredat sinyali**.
6. **Öğrenen Hafıza**: koçluk arşivi + kağıt-form + **günün aksiyonları kuyruğu** + extract-then-confirm.
7. **Usta Yolu**: animasyonlu eşleşme tablosu + müsait-saat slotları + eğitimcinin eğitimi.
8. **Ana siteye eklendi + gated** (Shift Organizer şifresi, `useAuthGate`); Home'da kart.
9. **Preview deploy** (Vercel, production'a dokunmadan): `zaratraining-2wh28byqs...`/pusula (Vercel SSO arkasında).
10. **TR/EN/ES dil seçici** — ama yalnız **iskelet** (nav·başlık·buton·filtre·güvence).
11. **Sunum paketi** (`docs/Pusula-Sunum/`): 10 sayfa PDF deck + not defteri + 10 görsel.

## Yapılanlar (commit YOK — lokal inceleme)
12. **Saha Krokisi** (`views/SahaKrokisi.tsx` + `data-floor.ts` + `public/pusula-plan.png`):
    kroki + zone'lar + **canlı trafik pulse markörleri** + tıkla→Pusula yerleşim önerisi (nitel, skor yok).

## Kalan iş (bu tur + devam)
### A) İçerik çevirisi (EN/ES) — şu an sadece başlıklar çevrili
**Mimari karar:** üretilmiş metin = `data-program` fonksiyonlarına `lang` param; statik içerik = `{tr,en,es}`.
- **Lang-aware generated:** `sellingPersona`, `pusulaReading`, `areaSignals`, `periodActions`, `finalReport`, `COMPETENCY_SCALE`, ASA/durum etiketleri → `data-program.ts`/`data-staff.ts` (lang) ; çağrı yerleri `useLang()` ile.
- **Narrative statik:** glossary(9), recommendations(3), mentor(4), curriculum(3), daily(5), coach notes(7) → `{tr,en,es}`.
- **120 booklet topic** (`data-gelisim.ts`) → EN/ES (en büyük chunk; mekanizma kurulur, parça parça doldurulur).
- **Kalan UI label:** tüm view'lardaki eyebrow/panel etiketleri i18n sözlüğüne.

### B) Stitch cilası (profil RESMİ YOK)
- **Ekip kartı:** alt **accent bar** (mastery/persona tonunda) — fotoğraf yok, initials kalır.
- **Profil:** daha ferah düzen + büyütülmüş gelişim eğrisi.
- **Defter:** kategori başına mini progress bar (opsiyonel).

## Yürütme sırası (nereden devam)
1. Stitch cilası (bounded) → `PersonCard.tsx` + `editorial.css`, `Profil.tsx` + CSS.
2. `data-program.ts`/`data-staff.ts` lang-aware + çağrı yerleri (`Profil`, `GelisimDefteri`, `SahaKrokisi`).
3. Narrative statik `{tr,en,es}` (mentor/curriculum/daily/glossary/recommendations/notes).
4. 120 topic EN/ES.
5. Kalan UI label sweep.
6. `npm run check`/`lint` + screenshot QA + (onayla) preview deploy.

**Not:** kullanıcı isteğiyle bu çalışmalar commit edilmeden lokalde inceleniyor; deploy onayla.
