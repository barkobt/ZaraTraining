# Pusula — demo senaryosu

> İnsan ana sahne; operasyonel verim onun **sonucu** (geçiş değil **genişleme** —
> "aynı uzman, genişleyen bakış"). Tek motor: Tanı → Geliştir → Yerleştir.
> Roster + yetkinlikler GERÇEK (ShiftOrganizer seed'i, 30 kişi). Sert skor/sıralama YOK.

Rota: **`/pusula`**. Üst nav **hover-click dropdown**: İNSAN · GELİŞİM · SONUÇ.

## İNSAN
1. **Ekip** — 30 gerçek personel (Ada·Baran[koç]·Begüm·Fatma[Kabin ★★★★]·Şeyma…).
   Her kart: ustalık çipi, güçlü/gelişen yan, soluk güven (●●●○). Profili yetkinlik
   + tenure'dan NİTEL türetilir. Karta tıkla → drawer.
2. **Profil** — derin okuma: ASA(+kanıt) · gelişim eğrisi · ASA→KPI köprüsü · beceri
   matrisi (gerçek rol yetkinliklerinden) · (usta ise) Usta Aktarımı.

## GELİŞİM (kişilerin eğitimi · öğrenen hafıza · eğitimcinin eğitimi)
3. **Gelişim Defteri** — gerçek 3 kitapçıktan, **5 sekme**:
   - **Takip**: rol (Satış/Kasa/Operasyon) + seviye (Başlangıç/Orta/İleri) + 4-durum
     işaretleme (Teorik/Yapabiliyor/Geliştirilmeli/Öğretebilir). Gerçek topic'ler.
   - **Yetkinlik**: 5 davranışsal yetkinlik × 4 dönem (Hafta 2/4/6/8) — 0–5 ölçeği
     ETİKETLE (Gözlemlenmedi→Çok Güçlü), sayı basılmaz. Eğitim önceliği işaretli.
   - **Dönem Aksiyonu**: Hafta 2/4/6/8 öncelik → hedef → aksiyon (profilden türetilir).
   - **Dönem Raporu**: Güçlü Yönler / Gelişim Alanları / Sonuç.
   - **Sözlük**: aranabilir terim sözlüğü.
4. **Öğrenen Hafıza** — koçluk gözlem arşivi (haftalık notlar burada birikir): zaman
   çizelgesi + editöryal kağıt-form + nitel gidişat. **Koçluk anı**: gözlem yaz →
   Pusula yöntemi çıkarır → koç onaylar (extract-then-confirm). Bilgi kaybolmaz.
5. **Usta Yolu** — mentor↔mentee: yetkinlik boşluğu + vardiya çakışması → gerekçeli
   eşleşme + onayla/düzenle + "Yeniden optimize" (model öğrenir). Koç da mentee olur
   (eğitimcinin eğitimi). Güven SOFT, yüzde yok.

## SONUÇ
6. **Yerleştirme (kalp)** — GERÇEK akşam chart'ı (15–20, gerçek 8 kişilik ekip, roller
   operasyonel sırada). **ÖNCE**: ustalar (Fatma·Şeyma ★★★★) arka zone/Sprinter'da boşa,
   tepe kabin yeni ellerde (Asya·Gamze) → cep gergin. **Uygula** (tek tek, kademeli):
   Pusula yetkinliğe göre ustaları **tepe kabine akıtır** (layoutId morph), yeniler sakin
   zone'a; akşam cebi (kilitli 17–19) yumuşakça rahatlar. Gerçek saatlik eğri (Export.xlsx
   2025: tepe trafik · dip conversion). Kanıt öneride. "Hepsini uygula / Sıfırla".

## His & sınır
Sakin/editöryel/sıcak (Bodoni serif · porselen · pirinç). Güvenceler görünür: "Karar
sizde", "Sert kısıtlar korundu", "Bu profili/raporu çalışan da görür", "Değerlendirme =
gelişim için". Skor-tablosu değil.

## Mimari
- `data-staff.ts`: 30 gerçek personel (seed) + yetkinlikten türetilen profiller + `STAFF_COMP`.
- `placement.ts`: gerçek-his chart motoru (disjoint swap'lar, kademeli) + tRPC seam
  (gerçekte `chart.generate` → `SolveResponse.chart`; UI değişmez).
- `data-gelisim.ts` / `data-program.ts`: gerçek kitapçık topic'leri + dönem/yetkinlik/rapor türetimi.
- `data-hafiza.ts` / `data-mentor.ts`: gerçek roster id'leri.
- **Mock.** `main`, Python solver, `brain/` dokunulmadı. Skor/sıralama/sert rakam yok.

## Çalıştırma
```
npm run dev   # → http://localhost:3000/pusula
```
