# Pusula — Yaşayan Uzman · Uçtan Uca Not Defteri

> Bu defter, `PUSULA-Sunum.pdf` (10 sayfalık deck) ile birlikte kullanılır. Deck sahnede,
> bu defter hazırlık + soru-cevap içindir. Tüm görseller `gorseller/` altında.
>
> **Tek cümle:** *İnsan ana sahnedir; operasyonel verim onun sonucudur.* Pusula, kişinin
> yaşayan profilini çıkarıp hem gelişimine hem yerleşimine çeviren, sonucu ölçüp kendini
> güncelleyen tek AI motorudur. **AI'ı çıkar → geriye bir şey kalmaz** (painkiller, vitamin değil).

---

## 1) Problem — üç kırık, tek kayıp
- **İnsan gelişimi kâğıt kitapçıkta.** 8 haftalık saha programı tablet/kâğıtta takip ediliyor; veri çıkmıyor, ustanın gözlemi kayboluyor.
- **Usta ayrılınca bilgi gidiyor.** Aktarım kurumsallaşmamış — her yeni başlayan sıfırdan.
- **Yerleşim yeteneği görmüyor.** "Kim neyde gerçekten iyi?" vardiya bunu okumuyor; güçlü el yanlış yerde.
- **Sonuç (para):** Akşam tepe-saatinde (Export.xlsx, gerçek 2025) trafik **743 kişi** ama conversion **%17** — kapatılamayan açık talep cebi.

## 2) Çözüm — tek motor, kapalı döngü
**Tanı → Geliştir → Yerleştir → Ölç → Güncelle.** Her hafta daha keskin, daha güvenli.
People ile açıyoruz (AI en yadsınamaz: senaryo keşfi, ustalık aktarımı, öğrenen hafıza),
operasyonel parayla bağlıyoruz (yerleşim akşam cebini rahatlatır). Bu bir **geçiş değil,
genişlemedir**: aynı uzman, genişleyen bakış.

---

## 3) Modüller (nav: İNSAN · GELİŞİM · SONUÇ)

### İNSAN
- **Ekip** (`02-ekip.png`): 30 gerçek kişi. **Rol-tipi** (Satış Danışmanı / Commercial / Müdür)
  ve **yaşam-evresi** (Yeni/Yetkin/Usta/Koç) filtreleri — herkes ayrı izlenir. Kartta nitel
  güçlü/gelişen yan + soluk güven (rakam yok).
- **Profil** (`03-profil.png`): "Pusula okuması" (üretilmiş, kanıt-farkında) + **satış personası**
  (Approacher / Welcomer / Mix&Match — 3 enerjiden biri) + **alan-spesifik dinamik sinyaller**
  (FR→satış, zone sell-through, welcome→merma) **belirsizlikle (n)** + **ASA→KPI köprüsü** +
  beceri matrisi + gelişim eğrisi. **Yokluk ≠ başarısızlık:** veri yoksa keşif önerilir.

### GELİŞİM
- **Defter** (`04-defter-takip.png`, `06-defter-evre.png`): dijital takip kitapçığı.
  - **120 gerçek topic** (3 rol × 3 seviye; Müşteri/Ürün/Süreçler) kitapçığa birebir.
  - Her tik **tarih + pill-notu** alır (koç ne yaptığını yazar → sistem öğrenir).
  - **Öğretebilir** seviyesi → kişi otomatik **mentor adayı** (özel karşılama).
  - **Yetkinlik** (5 davranışsal × 4 dönem, 0–5 **etiketle** — sayı basılmaz).
  - **Dönem Aksiyonu / Raporu** yazılabilir (AI taslak + koç düzenler).
  - **Evre Planları:** Yeni/Yetkin/Usta/Koç için **ayrı, hover ile açılan** tablolar — herkesin planı farklı.
- **Öğrenen Hafıza** (`07-hafiza.png`): koçluk gözlem arşivi (bilgi kaybolmaz) + editöryal kağıt-form +
  **günün aksiyonları kuyruğu** ("sıradaki öğretilecekler", tiklenir) + **koçluk anı** (yöntemi
  çıkar → koç onaylar, extract-then-confirm) + **müfredat sinyali** (koç notlarındaki ortak desen → plan revizyon önerisi).
- **Usta Yolu** (`08-usta.png`): animasyonlu mentor↔mentee eşleşme tablosu + **müsait-saat eğitim
  slotları** (önceki günden bilinir) + "yeniden optimize" (model öğrenir) + **eğitimcinin eğitimi**
  (koç da mentee).

### SONUÇ
- **Yerleştirme — demo'nun kalbi** (`09-yerlestirme-kadro.png`, `10-yerlestirme-chart.png`):
  - **Talep + Productivity → gerçek kadro.** Benzer-gün tahmini + prod sapması over/understaffing'i okur.
  - **Surplus:** boşa düşeni (düşük/orta yetkin) **desteğe** yönlendir → prod artar, manuel reviz biter.
  - **Yetkinlikle yerleşim** + kademeli "Uygula": ustalar tepe kabine **akar** (layoutId morph).
  - **Koçluk-komşuluğu:** "koç chartta var ≠ vakit ayırıyor" → sahada 0 saat flag'i + telafi.
  - Akşam cebi **gergin → rahat**. Kanıt öneride, kişide değil.

---

## 4) Öğrenen motor — hangi veri nereye gelince ne canlanır

| Veri kaynağı | Nereye gelir | Nasıl canlanır |
|---|---|---|
| **Orquest** — saatlik trafik tahmini | Yerleştirme | Benzer geçmiş günlerden (gün-türü + hava + özel-gün) yük eğrisi + **gerekli kadro** |
| **Productivity** (satış / işçilik-saat) | Yerleştirme | Prod ≪ hedef → fazla kadro (surplus); prod ≫ hedef → yetersiz, **güçlü el** + cep riski |
| **KPI** (conversion · UPT · ATV, Export.xlsx) | Profil · Yerleştirme | Akşam cebi göstergesi + **ASA→KPI** köprüsü; persona/güç güncellenir |
| **Yetkinlik matrisi** (Orquest aptitude) | Profil · Chart | **Day-0 prior**; yetkinliğe göre yerleşim ve mentor eşleşme |
| **Alan çıktıları** (FR→satış, zone sell-through, welcome→merma) | Profil | **Dinamik alan-spesifik boyut** + belirsizlik; prior'ı üzerine yazar |
| **Kitapçık işaretleri + koç notları** | Defter · Hafıza · Müfredat | "Ne zaman işaretledim" öğrenme pattern'i + **plan revizyon** önerisi |
| **Gerçekleşen sonuç** (sonraki dönem gelişimi / conversion lift) | Motor | Objective ağırlıkları + profiller **kendini günceller** |

**Derin noktalar (jüri sorabilir):**
- **Yokluk ≠ başarısızlık.** Kişi bir alanda bulunmadıysa "zayıf" denmez; o boyut prior'da +
  **yüksek belirsizlikle** durur. Düşük-kanıtlı alana **keşif** (buddy eşliğinde 1 vardiya) gider —
  hem geliştirir hem sinyal toplar. Bu keşif, "hep Kabin'de → iyi mi yoksa hep orada mı" **confounding'ini
  çözen yumuşak randomizasyondur** (gelişim + nedensel geçerlilik tek hamlede).
- **Rol-tipine göre farklı başarı:** Yeni = gelişim eğimi; Yetkin = yük altında istikrar + öğretmeye
  başlama; Usta/Koç = **mentee lifti** (kişisel KPI değil).
- **Eğitimcinin eğitimi:** iyi koçların aksiyon planları + **işaretleme ritmi** + mentee-iyileşmesi →
  "iyi koçluk neye benzer" öğrenilir, yeni koça şablon önerilir.
- **Koçluk-komşuluğu:** chart, trafik kapsamasıyla birlikte slack saatlerde koç+mentee'yi yan yana
  koyar; koç başarısı = takvimde görünmek değil, **sahada geçen zaman + lift**.

---

## 5) Sınırlar & etik (öne çıkar)
- **Skor-tablosu değil** — çok boyutlu, tek rakam/sıralama yok.
- **Karar koçta** (öneri, dayatma değil) · **çalışan kendi profilini görür** (şeffaf, kıyaslamasız).
- **Değerlendirme gelişim için**, ceza/pay/disiplin için değil; **belirsizlik gizlenmez**.
- **EU AI Act Annex III** (işçi değerlendirme/izleme = yüksek risk) → insan gözetimi + şeffaflık +
  gelişim-odak. Bu yüzden 0–5 yetkinlik bile **etiketle** gösterilir.
- **Sert kısıtlar korunur:** mola · kapasite · yetkinlik. Telemetri (sahada-süre) asla eval sinyali değil.

## 6) Mimari & demo gerçeği
- **Şimdi:** mock-ama-sadık. **Gerçek roster** (ShiftOrganizer seed, 30 kişi + yetkinlik), gerçek
  kitapçık içeriği, gerçek 2025 akşam cebi. Chart şekli **birebir solver çıktısı**
  (`{role, hour, persons[]}`) → `placement.ts` seam'i ile canlıya geçer, **UI değişmeden**.
- **Dokunulmadı:** `main`, Python CP-SAT solver, deployed sistem, `brain/` (yalnız birkaç UI atom'u yeniden kullanıldı).
- **Dosya haritası (özet):** `data-staff.ts` (gerçek roster + türetme), `placement.ts` + `staffing.ts`
  (chart + kadro/surplus), `data-gelisim.ts` + `data-program.ts` (kitapçık + dönem/yetkinlik/rapor/persona),
  `data-hafiza.ts` · `data-mentor.ts` · `data-curriculum.ts`, `views/*` + `components/*`.

## 7) Yol haritası
- Canlı solver köprüsü (Orquest forecast + CP-SAT objective'e öğrenilmiş terim).
- Alan-sinyallerini **canlı CX/satış verisine** bağlama (persona statikten dinamiğe).
- EN/ES submission paketi (deadline 12 Haziran).
- Defter işaretini otomatik Hafıza kaydına bağlayıp döngüyü görünür kapatma.

---

## 8) Sunum konuşma akışı (deck sayfalarıyla)
1. **Kapak** — "Aynı uzman, genişleyen bakış." Tek cümlelik vaat.
2. **Problem** — üç kırık + %17 cep (para kaybı). Sahneyi kur.
3. **Çözüm** — kapalı döngü; "AI'ı çıkar → bir şey kalmaz".
4. **İnsan** — yaşayan profil, 3 enerji, belirsizlik, yokluk≠başarısızlık. *Ekran göster.*
5. **Defter** — 120 topic, tarih+not, Öğretebilir→mentor, evre planları. *Ekran göster.*
6. **Hafıza & Usta** — bilgi kaybolmaz, koçluk sahada, müfredat öğrenir. *Ekran göster.*
7. **Yerleştirme (kalp)** — talep+prod→kadro→surplus; ustalar tepe kabine akar; cep rahatlar. *Morph'u anlat.*
8. **Veri → canlanma** — tablo; "hangi veri nereye gelince ne canlanır". *En teknik, en ikna edici sayfa.*
9. **Sınır & güven** — skor-tablosu değil; EU AI Act; karar koçta.
10. **Kapanış** — çalışan demo + gerçeğe hazır mimari + tek cümle: *"İnsan en önemlisidir; gerisi onun sonucudur."*

**30 saniyelik özet:** Pusula, mağazadaki insanın yaşayan profilini gerçek yetkinlik + gerçekleşen
sonuçtan çıkarır; bunu gelişim planına ve vardiya yerleşimine çevirir; akşam tepe-saatinde doğru
insanı doğru ana koyarak conversion cebini rahatlatır; sonucu ölçüp her hafta kendini geliştirir —
skor-tablosu değil, insan-onaylı bir gelişim ve yerleşim motoru.
