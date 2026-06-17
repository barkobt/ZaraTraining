# ZARA Atelye — Agent Ekibi

Tasarım çalışmasının her aşamasında danışılan kalıcı denetim ekibi. Bu klasördeki
`.md` dosyaları Claude Code **subagent** tanımlarıdır (`subagent_type` = dosya adı).

## Ekip

| Agent | Rol | Tetikleyici |
|---|---|---|
| **design-council** | Görsel/estetik kurul — ekran görüntüsüyle editöryel kaliteyi denetler, somut öneri verir | Cesur/görsel değişiklik sonrası |
| **responsive-auditor** | 1440/768/390'da responsive + sticky-nav/mobil davranışını denetler | Layout değişikliği sonrası |
| **code-correctness** | build + tsc + lint + test; yeni hatayı önceden-kırıktan ayırır | Her kod turundan sonra |
| **creative-scout** | Web'den özgün, AI-klişesi olmayan editöryel fikirler araştırır/önerir | Yeni ekran/öğeye yön ararken |

## "Agentleri çalıştır" ne demek

Kullanıcı **"agentleri çalıştır"** dediğinde (ya da bir aşama bitince
"agentlerin fikrini al"), ana asistan bu agentleri **paralel** spawn eder
(`Agent` tool, `subagent_type` = ilgili ad), her birine o turun değişikliklerini
+ bakılacak rota/öğeyi verir, dönen raporları kullanıcıya özetler. Görsel
agentler için dev server `http://localhost:3000` ayakta olmalı.

## Altyapı
- `scripts/shoot.mjs <url> <out.png> [css-selector]` — tek kare / odak (2x DPR).
- `scripts/shoot-responsive.mjs <url> <out-prefix> <w1,w2,...>` — çoklu genişlik.
- Sistem Chrome + `puppeteer-core` (indirme yok). Çıktı `.screenshots/` (gitignore).

## Rotalar (dev)
- `/` landing · `/pusula?view=ekip|bugun|profil|defter|...` · `/shift-organizer`
- Pusula deep-link: `?view=<id>`; çapraz-link (sembolik): `?person` / `?focus`.

## Tasarım ölçütü (hepsi uyar)
Krem kâğıt + mürekkep + TEK altın aksan · Newsreader serif **medium** (bold yok)
· Inter body · geniş mono eyebrow · base-4 spacing · keskin köşeler · EMOJİ YOK
· Pusula monokrom flat. Detay: `design_handoff_zara_atelye/README.md` (salt-okunur).
