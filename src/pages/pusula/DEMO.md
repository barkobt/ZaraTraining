# Pusula — demo senaryosu

> İnsan ana sahne; operasyonel verim onun **sonucu** (geçiş değil **genişleme** —
> "aynı uzman, genişleyen bakış"). Tek motor: Tanı → Geliştir → Yerleştir.
> Roster + yetkinlikler GERÇEK (ShiftOrganizer seed'i, 30 kişi). Sert skor/sıralama YOK.

Rota: **`/pusula`**. Üst nav **hover-click dropdown**: İNSAN · GELİŞİM · SONUÇ.

## İNSAN
1. **Ekip** — 30 gerçek personel (Ada·Baran[koç]·Begüm·Fatma[Kabin Akışı: usta]·Şeyma…).
   Her kart: ustalık çipi, güçlü/gelişen yan, soluk güven (●●●○). Profil 6'lı KANIT
   katmanından (data-competency) NİTEL türetilir. Karta tıkla → drawer.
2. **Profil — hikâye akışı**: Kim (persona+okuma) → **Neyde güçlü** (6 operasyonel
   yetkinlik kartı: nitel seviye + kanıt satırı [kabin sayacı / vardiya-kesişim KPI /
   kitapçık / EAS / koç] + davranışsal taban şeridi + **keşfedilmemiş alanlar** =
   boş bar değil keşif aksiyonu) → **Nerede parlar** (zone talebi × kanıt) →
   **Nereye gidiyor** (yörünge+tahmin) → **Kanıt→Öneri→Onay** (aptitude döngüsü:
   kanıt birikir, Pusula Orquest aptitude güncellemesi önerir, koç onaylar) →
   Sıradaki adım (eğitimler · usta ise Usta Aktarımı).

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
   operasyonel sırada). **ÖNCE**: ustalar (Fatma·Şeyma) arka zone/Sprinter'da boşa,
   tepe kabin yeni ellerde (Asya·Gamze) → cep gergin. **Uygula** (tek tek, kademeli):
   Pusula kanıta göre ustaları **tepe kabine akıtır** (layoutId morph), yeniler sakin
   zone'a; akşam cebi (kilitli 17–19) yumuşakça rahatlar. 4 öneri türü+1: Güç · Sinerji ·
   Gelişim · Aktarım · **Keşif** (Selin → Zone 3, sakin saatte sinyal toplar). Tez dili
   KANIT dilidir (kabin sayacı · vardiya-kesişim). Gerçek saatlik eğri (Export.xlsx
   2025: tepe trafik · dip conversion). "Hepsini uygula / Sıfırla".
7. **Saha Krokisi** — zone'lar YER; her zone yetkinlik TALEP eder ("Bu zone ne ister"
   çipleri + baskı sinyali) ve "Kim uyar" kanıt gerekçesiyle gelir; sakin zone'da
   keşif adayı önerilir.

## His & sınır
Sakin/editöryel/sıcak (Bodoni serif · porselen · pirinç). Güvenceler görünür: "Karar
sizde", "Sert kısıtlar korundu", "Bu profili/raporu çalışan da görür", "Değerlendirme =
gelişim için". Skor-tablosu değil.

## Mimari
- `data-staff.ts`: 30 gerçek personel (roster) + `STAFF_COMP` (yalnız İÇ TOHUM — UI okumaz).
- `data-competency.ts`: **iki katman + keşif** modeli — 6 operasyonel yetkinlik
  (karşılama · kabin · dolum · sell-through · ürün · kayıp), kanıt kanalları
  (counter/attribution/booklet/eas/coach), durumlar (unexplored/emerging/proven),
  zone talebi eşleşmesi (ROLE_NEEDS, zoneFit), aptitude önerileri, keşif önerisi.
- `placement.ts`: gerçek-his chart motoru (disjoint swap'lar, kademeli) + tRPC seam
  (gerçekte `chart.generate` → `SolveResponse.chart`; UI değişmez).
- `data-gelisim.ts` / `data-program.ts`: gerçek kitapçık topic'leri + dönem/yetkinlik/rapor türetimi.
- `data-hafiza.ts` / `data-mentor.ts`: gerçek roster id'leri.
- **Mock.** `main`, Python solver, `brain/` dokunulmadı. Skor/sıralama/sert rakam yok.

## Çalıştırma
```
npm run dev   # → http://localhost:3000/pusula
```
