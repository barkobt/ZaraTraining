# Pusula — demo senaryosu

> İnsan ana sahne; operasyonel verim onun **sonucu** (geçiş değil, **genişleme** —
> "aynı uzman, genişleyen bakış"). Pusula tek motor: Tanı → Geliştir → Yerleştir.
> Hiçbir yerde sert skor/sıralama yok; her şey nitel + insan onaylı. Demo MOCK.

Rota: **`/pusula`** (üst soldaki ok ile `/brain`'e döner). Üst nav gruplu:
**İNSAN · GELİŞİM · SONUÇ**.

## Modüller (neye tıklanır)

### İNSAN
1. **Ekip** — 6 kişi (Selin·Ayşe·Mert·Ece·Kerem·Deniz): ustalık çipi, güçlü/gelişen yan,
   soluk güven (●●●○, rakam yok). Karta tıkla → sağ **drawer** (ASA + kanıt).
2. **Profil** — derin okuma: ASA(+kanıt) · gelişim eğrisi · **ASA→KPI köprüsü** ·
   kanıtlanan güç (KPI) · beceri matrisi · (usta ise) **Usta Aktarımı**.

### GELİŞİM (asıl amaç — kişilerin eğitimi, öğrenen hafıza, eğitimcinin eğitimi)
3. **Defter** — dijital **Gelişim Takip Kitapçığı** (gerçek 3 kitapçıktan zeminlendi):
   rol (Satış/Kasa/Operasyon) + seviye sekmeleri (Başlangıç/Orta/İleri) + her konuda
   **4-durum işaretleme** (Teorik/Yapabiliyor/Geliştirilmeli/Öğretebilir) + Sözlük.
   İşaretleme, "neyi ne zaman işaretledim" öğrenme pattern'inin sinyalidir.
4. **Hafıza** — **Öğrenen Hafıza**: koçluk gözlem zaman çizelgesi + editöryal kağıt-form
   (filigran/imza) + nitel gidişat. Altta **koçluk anı**: yeni gözlem yaz → Pusula
   yöntemi çıkarır → *"Yöntemini şöyle anladım — doğru mu?"* koç onaylar
   (**extract-then-confirm**). Aktarılan bilgi kaybolmaz.
5. **Usta Yolu** — mentor↔mentee eşleştirme: yetkinlik boşluğu + vardiya çakışması →
   gerekçeli eşleşme + onayla/düzenle + **"Yeniden optimize"** (model öğrenir). Koç da
   mentee olabilir (**eğitimcinin eğitimi**). Güven SOFT, match-score yüzdesi yok.

### SONUÇ
6. **Yerleştirme (kalp)** — Pusula önerir, koç **tek tek uygular** (kademeli, human-in-loop).
   Her "Uygula" kişiyi chart'ta yerine **akıtır** (layoutId morph) ve **akşam cebini**
   (kilitli 17:00–19:00) biraz daha rahatlatır (soluk amber→sage, sert kırmızı→yeşil yok).
   "Geri al" ile tersine. **Hepsini uygula / Sıfırla**. Altta **gerçek saatlik eğri**
   (Export.xlsx 2025: tepe trafik · dip conversion). Kanıt öneride, kişide değil.

## His & sınır
Sakin/editöryel/sıcak (Bodoni serif · porselen kâğıt · pirinç). Görünür güvenceler:
"Karar sizde — öneri, dayatma değil" · "Sert kısıtlar korundu: mola·kapasite·yetkinlik" ·
"Bu profili çalışan da görür" · "Herkes gelişir — koç da dahil". **Skor-tablosu değil.**

## Mimari & sınır
- **Kaynak veri:** `data.ts` (6 kişi, chart/öneri/cep — kullanıcı authored) + additive
  `data-gelisim.ts` / `data-hafiza.ts` / `data-mentor.ts` (gerçek kitapçık + koçluk + mentor).
- **Köprü:** `placement.ts` — kademeli morph motoru + **tRPC seam** (gerçekte
  `chart.generate` → `SolveResponse.chart`; UI değişmez).
- **Mock.** `main`, Python solver, `brain/` dokunulmadı (yalnız `brain/primitives` atom'ları
  yeniden kullanıldı). Skor/sıralama/sert rakam yok.

## Çalıştırma
```
npm run dev   # → http://localhost:3000/pusula
```
