# ZARA Atelye — Agent Ekibi

Bu klasördeki `.md` dosyaları Claude Code **subagent** tanımlarıdır
(`subagent_type` = dosya adı). Agentlar **üç AYRI sete** bölünür (A: shift ·
B: pusula görsel · C: database); tetikleyiciler karışmasın diye aşağıdaki harita
SABİTtir. **Yeni agent eklerken bu tabloyu güncelle.**

## Set 0 — orchestrator (önce bu konuşur)

| Agent | Rol |
|---|---|
| **agent-orchestrator** | Göreve bakıp HANGİ agent'lara gerek olduğuna karar verir; minimum ilgili seti + sırayı + önkoşulu döndürür. Spawn etmez, plan verir. |

**Kural:** kullanıcı **"agentları çalıştır"** dediğinde — özellikle "genel olarak"
dediğinde — ana asistan körlemesine hepsini başlatmaz; önce `agent-orchestrator`'a
danışıp (ya da onun mantığını uygulayıp) yalnız ilgili agent'ları çalıştırır.
Salt mantık/parser değişikliğinde görsel/responsive/font agent'ları ÇALIŞTIRILMAZ.

---

## Set A — shift-organizer (3 agent, hep birlikte)

Bu set **yalnız shift-organizer içindir** ve pusula/genel ekipten (Set B) BAĞIMSIZDIR.

| Agent | Sorduğu soru | Önkoşul |
|---|---|---|
| **shift-responsive-auditor** | Mobil/responsive'de bozulan alan var mı? (gerçek ekran görüntüsü, navbar→export hattı) | dev server ayakta |
| **shift-font-advisor** | Değişen DS font dosyalarına uyumlu mu? + özgün tipografi tavsiyesi (gerekirse web search) | — |
| **shift-integration-council** | Kodda hata var mı? ZaraTraining ↔ shift-solver-api entegrasyonu riskli mi? | — |

**Tetikleyici:** kullanıcı **"shift agentları çalıştır"** / **"shift-organizer
agentları"** dediğinde — ya da shift-organizer üzerinde değişiklikten sonra bağlam
shift iken **"agentları çalıştır"** dediğinde — bu 3 agent'ı **tek mesajda paralel**
spawn et, dönen raporları özetle.

---

## Set B — pusula / genel görsel (AYRI)

Tasarım çalışmasının her aşamasında danışılan kalıcı denetim ekibi.

| Agent | Rol | Tetikleyici |
|---|---|---|
| **design-council** | Görsel/estetik kurul — ekran görüntüsüyle editöryel kaliteyi denetler, somut öneri verir | Cesur/görsel değişiklik sonrası |
| **responsive-auditor** | 1440/768/390'da responsive + sticky-nav/mobil davranışını denetler | Layout değişikliği sonrası |
| **code-correctness** | build + tsc + lint + test; yeni hatayı önceden-kırıktan ayırır | Her kod turundan sonra |
| **creative-scout** | Web'den özgün, AI-klişesi olmayan editöryel fikirler araştırır/önerir | Yeni ekran/öğeye yön ararken |

**Tetikleyici:** **"pusula agentları"** / **"design-council"** / **"görsel kurul"**
ya da genel görsel bağlamda **"agentleri çalıştır"**. Set A (shift) bununla ÇALIŞMAZ.

> Not: Set B'nin DÖRT agent'ı da artık tanımlı (`design-council.md`,
> `responsive-auditor.md`, `code-correctness.md`, `creative-scout.md`).

---

## Set C — database (3 agent, `db-` önekli)

Bu set **yalnız veritabanı işleri içindir** (şema, migration, query katmanı,
ekran↔DB bağı) ve Set A/Set B'den BAĞIMSIZDIR. Önek `db-` = karışmama garantisi.

| Agent | Sorduğu soru | Önkoşul |
|---|---|---|
| **db-schema-auditor** | schema.ts ↔ migration ↔ canlı DB tutarlı mı? Drift / uygulanmamış migration / yıkıcı değişiklik var mı? | `.env.local` `DATABASE_URL` |
| **db-binding-auditor** | Pusula & shift-organizer ekranları DB'ye doğru bağlı mı? Mutation persist ediyor mu, hangi veri mock? ("yansımadı" şüphesini kanıtla/çürüt) | `.env.local` `DATABASE_URL` |
| **db-query-council** | Query katmanı + tRPC sözleşmesi doğru mu? create/update alan tutarsızlığı, Drizzle/hata/N+1 riski var mı? | — |

**Tetikleyici:** **"database agentları çalıştır"** / **"db agentları"** — ya da
veritabanı (db/, api/_lib/queries/, drizzle, schema/migration) üzerinde değişiklikten
sonra bağlam DB iken **"agentları çalıştır"** dendiğinde — bu 3 agent'ı **tek mesajda
paralel** spawn et, raporları özetle. Set A (shift) ve Set B (görsel) bununla ÇALIŞMAZ.

> Kural: Set C salt-okunur denetler — `db:migrate`/`db:push`/yazma işini agent
> kendi başına yapmaz; bulguyu döndürür, uygulama kararı ana asistanda/kullanıcıda.

---

## Çakışma kuralı (önemli)

- Belirsiz tek başına **"agentları çalıştır"**: o anki bağlam shift-organizer ise
  **Set A**, pusula/genel görsel ise **Set B**, veritabanı (db/şema/query/bağ) ise
  **Set C**. Bağlam net değilse hangi seti istediğini kullanıcıya SOR — yanlış seti
  çalıştırma.
- Açık tetikleyiciler (karışmaz): "shift agentları" → A · "pusula agentları" /
  "görsel kurul" → B · "database agentları" / "db agentları" → C.
- Yeni bir set (başka sayfa için) eklenirse: o sete benzersiz isim öneki ver
  (Set A'daki `shift-*` gibi), bu README'ye satır ekle, tetikleme cümlesini
  netleştir. Önek = setlerin karışmamasının garantisi.

---

## Çağırma mekaniği

Ana asistan `Agent` tool ile (`subagent_type` = ilgili ad) **paralel** spawn eder,
her birine o turun değişikliklerini + bakılacak rota/öğeyi verir, raporları özetler.
Görsel/responsive agentler için dev server `http://localhost:3000` ayakta olmalı.

**FALLBACK (önemli):** Yeni eklenen agentlar yalnız oturum BAŞINDA yüklenir;
aynı oturumda `subagent_type=<ad>` **"Agent type not found"** verebilir. O zaman
ana asistan `subagent_type=general-purpose` ile spawn eder ve ilgili
`.claude/agents/<ad>.md` gövdesini (rol + yöntem + çıktı) prompt'a enjekte eder —
davranış birebir aynı. Native tipler için oturumu yeniden başlatmak yeterli.

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
