# ZaraTraining (zaratraining.online)

Tek bir ZARA mağazası (3643 Bornova) için iç-eğitim ve operasyon araçlarını bir
araya getiren web uygulaması. Bir Vite SPA ile bir Hono+tRPC API'sini aynı
Vercel projesi altında çalıştırır. Neon Postgres veritabanı tüm modüllere
hizmet eder.

## Stack

| Katman | Teknoloji |
|---|---|
| Frontend | Vite 7 · React 19 · TypeScript 5.9 · React Router 7 (SPA) |
| API | tRPC v11 (Zod input + superjson) — `/api/trpc/*` |
| HTTP | Hono 4 · `@hono/node-server` (lokal) · Vercel Node Function (prod, `maxDuration: 60s`) |
| DB | Neon Postgres (HTTP) · Drizzle ORM · drizzle-kit migrations |
| UI | shadcn/ui (40+ Radix bileşeni) · Tailwind v3 · Framer Motion · sonner toast |
| Veri çekme | TanStack Query (`@trpc/react-query`) |
| Form | react-hook-form · Zod |
| PDF / Excel | jsPDF · jspdf-autotable · xlsx · xlsx-js-style |
| Auth | PinGuard (client-side PIN → localStorage); tRPC `auth.check` ile ekstra parola katmanı |
| External | Railway'de Python CP-SAT solver (shift planlama için) |

Yapı şu prensibi izler: **frontend ile backend tek deponun içinde**, paylaşılan
tipler `contracts/` altında, DB şeması `db/` altında, API kodu `api/_lib/` altında.

## Komutlar

```bash
npm install
npm run dev              # Vite + Hono dev server → http://localhost:3000
npm run check            # tsc -b (type check)
npm run test             # Vitest
npm run lint             # ESLint
npm run format           # Prettier

# Veritabanı
npm run db:generate      # schema.ts'e göre yeni migration üret (db/migrations/)
npm run db:migrate       # migration'ları DB'ye uygula
npm run db:push          # şemayı doğrudan push (hızlı dev, prod'da kullanma)

# Build & prod
npm run build            # vite build → dist/public/
npm run build:server     # esbuild api → dist/boot.js (lokal prod için)
npm start                # NODE_ENV=production node dist/boot.js
```

## Modüller

Uygulama bağımsız çalışan üç (eklenmekte olan dahil) modülden oluşur. Hepsi
aynı tRPC router ve aynı Neon DB'yi paylaşır.

### 1. Fitting Room — kişilik testi
Bir mağaza eğitiminin parçası olarak 4 senaryo sorusu; cevaplara göre kişi
3 "kabin"den birine yerleşir (Başlangıç / Gelişim / Altın).

| Route | Sayfa |
|---|---|
| `/` | Landing + QR (`Home.tsx`) |
| `/fitting-room` | Kabin tanıtımı |
| `/test` | 4 soruluk akış |
| `/sonuc/:id` | Kişisel sonuç ve uzun metin |
| `/show` | Sahne için grup reveal (`ShowPage`) |
| `/admin` | Canlı sonuç tablosu (PinGuard arkasında) |

İlgili dosyalar:
- `contracts/constants.ts` — `QUESTIONS`, `SCORING_TABLE`, `CABINS`, `calculateCabin()`
- `src/pages/Home.tsx`, `FittingRoom.tsx`, `TestPage.tsx`, `ResultPage.tsx`, `ShowPage.tsx`, `AdminPage.tsx`
- tRPC: `participant.{submit,getById}`, `admin.{list,stats}`
- DB: `participants` (id, name, answers jsonb, total_score, cabin, created_at)

### 2. Shift Organizer — vardiya planlama
30 personel × bir günlük zaman dilimi için hangi personelin hangi role
atanacağını CP-SAT solver ile optimize eder. Solver Python servisi olarak
Railway'de barındırılır (`SHIFT_SOLVER_URL`); Hono onu `solver-client.ts`
üzerinden çağırır. Üretilen chart `charts` tablosunda JSON olarak saklanır.

| Route | Sayfa |
|---|---|
| `/shift-organizer` | Ana çalışma sayfası |
| (admin) | Personel/yetkinlik/yasak rol çifti CRUD'ları |

İlgili dosyalar:
- `api/_lib/solver-client.ts` — Railway'e fetch
- `api/_lib/shift-mapping.ts` — staff rows → solver input
- `api/_lib/queries/{staff,solverConfig,charts,stores}.ts`
- `db/seed.ts` — 30 personel + yetkinlik seed'i (idempotent)

DB tabloları:
- `stores` (code, name, section) — şu an tek mağaza (id=1, code=3643)
- `staff` (storeId, fullName, shortName, tenureLevel, isManager, isBlacklisted, note)
- `competencies` ((staffId, role) PK, level 0–4)
- `solver_config` (storeId PK, competencyWeight, fairnessWeight, *Penalty, maxConsecutiveHours)
- `forbidden_role_pairs` (storeId, roleA, roleB)
- `charts` (storeId, shiftDate, shiftData jsonb, chartData jsonb, qualityScore, configSnapshot, responsibilities, status)
- `audit_log` (userId, action, entityType, entityId, changes)

### 3. Buenas Dias — sabah toplantı otomasyonu
Mağazanın her sabah yaptığı "Buenas Dias" toplantısının günlük hedef, aylık
challenge takibi ve performans metriklerini otomatikleştirir. İki "hesap motoru"
(Motor A: günlük hedef, Motor B: challenge dağıtımı) kullanır; geçmiş veriyi
referans alıp katsayılarla (haftasonu, özel gün, hava, stretch) çarparak hedef
üretir; yönetici onayı sonrası form toplantıda gösterilir, akşam gerçekleşen
veriler girilir; sistem kendi katsayılarını gerçekleşme verisinden kalibre eder.

| Route | Sayfa |
|---|---|
| `/buenas-dias` | Bugünün formu (üç mod: TASLAK düzenleme / ONAYLANDI sunum / GERCEKLESTI arşiv) |
| `/buenas-dias/setup` | Mağaza ayarları + aylık challenge + özel günler |

İkisi de PinGuard arkasında (`ADMIN_PIN`).

Tam spesifikasyon: `~/Desktop/buenas-dias-generator/buenas_dias_spec.md`.
İlke kuralları: şeffaflık (her sayı açıklanabilir) · insan onayı esastır
(durum zinciri TASLAK→ONAYLANDI→GERCEKLESTI) · sistem kendi hafızasını tutar
(7 gün önceki kayıt otomatik referans) · yarım veri kümülatife karışmaz
(sadece GERCEKLESTI kayıtlardan toplanır).

DB tabloları:
- `buenas_store_settings` (storeId PK; compranTarget, gapTarget, productivityTarget, defaultStretch, weekendWeight, weekendDayFactor, city)
- `coefficients` (type unique; currentValue, defaultValue, sampleCount, lastSuggestedValue) — Motor A kalibrasyon katsayıları
- `coefficient_samples` (storeId, type, date, sampledValue, appliedAt) — kalibrasyon örnekleri (her GERCEKLESTI gün için)
- `challenges` (month unique; tier1TargetTl, tier2TargetTl, startDate, endDate, avgBasketTl) — aylık challenge
- `daily_records` (date unique; status, dayType, isSpecialDay, weather, target/ref/actual alanları, serbest metin) — **sistemin kalbi**
- `special_days` (start_date, end_date; name, coefficient) — özel gün takvimi
- `buenas_users` (name, role, pinHash) — Faz 5+ rol-bazlı genişleme için zemin (şu an kullanılmıyor)

İlgili dosyalar:
- `contracts/buenas-dias.ts` — paylaşılan enum/tip/sabit
- `api/_lib/buenas-dias/{engine-a,engine-b,derived,calibration,weather}.ts` — saf hesap motorları + Vitest birim testleri
- `api/_lib/queries/{days,coefficients,challenges,specialDays,storeSettings,calibration}.ts`
- `db/seed-buenas-dias.ts` — katsayı + ayar + 2026 özel gün başlangıç değerleri
- `src/pages/buenas-dias/{Today,Setup}.tsx` + `components/{BuenasDiasForm,ActionBar,CalibrationBanner}.tsx`
- `src/lib/buenas-dias/pdf.ts` — jsPDF arşiv çıktı üreteci

tRPC API (özet):
- `buenasDias.days.{ensure, getByDate, list, calculate, calculateAndSave, derived}` — gün CRUD + Motor A
- `buenasDias.daysMutations.{upsertTargets, approve, unapprove, setActuals, close, reopen}` — durum zinciri
- `buenasDias.challenge.status` — Motor B + Motor A↔B karşılaştırma rozeti
- `buenasDias.challenges.{list, getActive, upsert}` — aylık challenge yönetimi
- `buenasDias.specialDays.{list, find, upsert, delete}` — özel gün takvimi CRUD
- `buenasDias.settings.{get, update}` — mağaza ayarları
- `buenasDias.coefficients.list` — Motor A katsayıları
- `buenasDias.calibration.{pending, accept, dismiss}` — kalibrasyon önerileri (spec §3.2)
- `buenasDias.weather.today` — Open-Meteo (anahtar gerekmez)
- `buenasDias.helpers.gapFromChanges` — visit% / satış%'ten Gap yardımcısı

Tüm fazlar (`buenas_dias_spec.md` §8) **tamamlandı**:
0. İskelet + veri modeli
1. Motor A + Vitest
2. Motor B + durum zinciri + Motor A↔B karşılaştırma
3. Türev metrikler (Compran/Productivity/Gap) + sistem hafızası (7 gün önceki ref)
4. Form üç mod + inline-edit + canlı recalc + PDF + Open-Meteo
5. Kalibrasyon (3+ örnek → ortalama → öneri) + setup ekranı + PinGuard
6. Home kartı entegrasyonu

**Birim test özeti:** Vitest 4 dosya, 68 test, hepsi yeşil (`npm test`):
- `engine-a.test.ts` 17 test (Motor A spec §3.1 örnekleri + edge cases)
- `engine-b.test.ts` 14 test (Motor B spec §8 senaryosu + compareToTarget)
- `derived.test.ts` 21 test (Compran/Productivity/Gap edge cases)
- `calibration.test.ts` 16 test (dominant coefficient seçimi + sample/ortalama)

## Ortam değişkenleri

`.env.local` (geliştirme), Vercel Environment Variables (prod):

| Değişken | Zorunluluk | Açıklama |
|---|---|---|
| `DATABASE_URL` | **zorunlu** | Neon Postgres bağlantı string'i (`postgresql://user:pass@host/db?sslmode=require`) |
| `SHIFT_SOLVER_URL` | Shift Organizer için | Railway'deki Python CP-SAT servisinin baz URL'i |
| `SHIFT_ORGANIZER_PASSWORD` | opsiyonel | Boşsa `auth.required` false döner; doluysa Shift Organizer için ekstra parola |

Buenas Dias modülü ek bir ortam değişkeni gerektirmez (Open-Meteo anahtar
istemiyor). Faz 5'te role-bazlı PIN'ler tablo içinde tutulur, env'de değil.

## Auth

İki katmanlı, deliberately minimal:

1. **PinGuard** (`src/components/PinGuard.tsx`) — client-side PIN guard,
   `localStorage`'a `admin_access_granted=true` yazar. Sabit PIN
   `ADMIN_PIN = "000000"` (`contracts/constants.ts`). Admin paneller bunun arkasında.
2. **tRPC `auth.check`** — `SHIFT_ORGANIZER_PASSWORD` env tanımlıysa, gelen token
   ile eşleştirilir; eşleşmezse mutation reddedilir. Shift Organizer için ikinci
   katman; "yanlışlıkla canlı mağaza datasına dokunmayı" engeller.

Bu basit modeli koruyoruz çünkü uygulama tek mağazaya, küçük bir ekibe hizmet
ediyor. Faz 5'te (Buenas Dias çoklu kullanıcı) `buenas_users` tablosuyla beş rol
için bcrypt PIN hash'leri eklenecek; PinGuard rol-aware hale getirilecek.

## Dizin yapısı

```
ZaraTraining/
├── api/
│   ├── index.ts            ← Vercel Node Function entry (named HTTP method exports)
│   └── _lib/               ← Vercel _-prefixed: bundle'a girer ama route olmaz
│       ├── boot.ts         ← Hono uygulaması + tRPC fetch adapter
│       ├── router.ts       ← tRPC ana router (modül sub-router'larını birleştirir)
│       ├── middleware.ts   ← initTRPC, superjson, Zod hata formatter
│       ├── context.ts      ← createContext (req)
│       ├── solver-client.ts, shift-mapping.ts  ← Shift Organizer
│       ├── queries/        ← Drizzle query fonksiyonları (modül başına dosya)
│       ├── buenas-dias/    ← (Faz 0+) saf hesap motorları
│       └── lib/            ← env.ts, http.ts, vite.ts
├── db/
│   ├── schema.ts           ← TÜM modüllerin pgTable tanımları
│   ├── relations.ts        ← Drizzle relations
│   ├── seed.ts             ← Shift Organizer seed (30 personel + yetkinlik)
│   ├── seed-buenas-dias.ts ← (Faz 0+) katsayı + ayar seed'i
│   └── migrations/         ← drizzle-kit çıktıları
├── contracts/              ← Frontend/backend paylaşılan tipler/sabitler
│   ├── constants.ts        ← Fitting Room (QUESTIONS, SCORING, CABINS) + ADMIN_PIN
│   ├── types.ts
│   ├── errors.ts
│   └── buenas-dias.ts      ← (Faz 0+) Buenas Dias enum/tip/sabit
├── src/
│   ├── App.tsx             ← React Router route tanımları
│   ├── main.tsx            ← Vite entry
│   ├── pages/              ← Sayfa bileşenleri (modül başına)
│   ├── components/         ← Paylaşılan bileşenler (PinGuard, vb.) + ui/ shadcn
│   ├── providers/trpc.tsx  ← TanStack Query + tRPC client provider
│   ├── hooks/, lib/utils.ts
│   └── index.css, App.css  ← Global / app stilleri
├── public/                 ← Statik (logo, favicon, vb.)
├── vercel.json             ← Vercel deployment config
├── drizzle.config.ts       ← schema path + dialect: postgresql
├── vite.config.ts, tsconfig.*.json, tailwind.config.js, eslint.config.js
└── DEPLOY.md               ← Production deployment talimatları
```

## Geliştirme akışı: yeni şema değişikliği

```bash
# 1) db/schema.ts'i düzenle
# 2) migration üret
npm run db:generate
# 3) migration'a göz at, DB'ye uygula
npm run db:migrate
# 4) dev server'ı yeniden başlat
npm run dev
```

`db:push`'u sadece deneysel/yerel ortamda kullan; production geçişlerinde her
zaman generate + migrate ile takip edilebilir bir migration dosyası bırak.

## Deploy

Detay için `DEPLOY.md`. Özet: Vercel'e bağlı, `main` branch'i her push'ta otomatik
deploy. `vercel.json` ile build (`vite build`), output (`dist/public`), serverless
function (`api/index.ts`) ve SPA fallback rewrite tanımlanmış.

## Domain & ekip
- Production: https://zaratraining.online
- Mağaza: ZARA 3643 Bornova
- Repo sahibi: Baran Bozkurt
