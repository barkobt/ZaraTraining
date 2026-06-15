# Pusula — Sunum Paketi

Yöneticilere yönelik, ~10 sayfalık dolu-dolu sunum + uçtan uca anlatım.

## İçindekiler
- **`PUSULA-Sunum.pdf`** — 10 sayfalık deck (16:9, editöryel). Sahnede gösterilecek.
- **`PUSULA-Sunum.html`** — deck kaynağı (düzenlenebilir; yeniden PDF basmak için aşağıya bak).
- **`PUSULA-Notebook.md`** — uçtan uca not defteri: problem, kapalı döngü, modüller,
  **veri → nereye gelir → nasıl canlanır** tablosu, sınırlar/etik, mimari, yol haritası,
  sayfa-sayfa konuşma akışı + 30 sn özet.
- **`gorseller/`** — sunuma eklenebilecek 10 temiz uygulama görseli:
  `01-nav-moduller` · `02-ekip` · `03-profil` · `04-defter-takip` · `05-defter-yetkinlik` ·
  `06-defter-evre` · `07-hafiza` · `08-usta` · `09-yerlestirme-kadro` · `10-yerlestirme-chart`.
- **`EKLER.md`** — ilk sunumdan sonra eklenen **yeni özellikler** (sunuma eklenebilir ekler,
  her biri tek-cümle başlık + ne/neden + görsel): **Saha Krokisi**, kişiye-özel **derin profil +
  tahmin**, **çok-dillilik (TR/EN/ES)**, zengin önizleme, yeni filtreler, **interaktif Yetkinlik**,
  takip edilebilir Dönem, tek-not takip, Hafıza rozetleri, Usta onayı, cilalanmış grafikler.
- **`ekler-gorseller/`** — EKLER.md'nin 12 görseli (`E01-saha-krokisi` … `E12-yerlestirme-grafik`).

## Deck'i yeniden PDF basmak (HTML değişirse)
```
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new \
  --no-pdf-header-footer --virtual-time-budget=8000 \
  --print-to-pdf="docs/Pusula-Sunum/PUSULA-Sunum.pdf" \
  "file://$(pwd)/docs/Pusula-Sunum/PUSULA-Sunum.html"
```

## Görselleri tazelemek (uygulama değişirse)
`npm run dev` açıkken, `/tmp/capture.mjs` benzeri bir Puppeteer betiğiyle `gorseller/` yenilenir.
Tüm görseller `/pusula` ekranından, 1440×900 @2x alınmıştır.
