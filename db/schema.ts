import {
  pgTable,
  serial,
  varchar,
  jsonb,
  integer,
  timestamp,
  boolean,
  text,
  date,
  real,
  index,
  uniqueIndex,
  primaryKey,
} from "drizzle-orm/pg-core";

export const participants = pgTable("participants", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  answers: jsonb("answers").notNull(),
  totalScore: integer("total_score").notNull(),
  cabin: varchar("cabin", { length: 50 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const stores = pgTable("stores", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 10 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  section: varchar("section", { length: 20 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const staff = pgTable(
  "staff",
  {
    id: serial("id").primaryKey(),
    storeId: integer("store_id").references(() => stores.id, { onDelete: "cascade" }),
    fullName: varchar("full_name", { length: 100 }).notNull(),
    shortName: varchar("short_name", { length: 30 }).notNull(),
    tenureLevel: varchar("tenure_level", { length: 20 }).notNull(),
    // ── Alan-bazlı (area-based) v2 sistemi ──────────────────────────────────
    // Kişinin sabit çalışma alanı: WOMAN | BASIC | TRF | FITTING_ROOM |
    // SPRINTER | RUNNER_360. NULLABLE bilinçli: v1 (yetkinlik-bazlı) solver
    // bu kolonu hiç okumaz, dolayısıyla null kalması eski sistemi bozmaz.
    // v2 solver çalışırken bu alanı sabit istasyon olarak kullanacak.
    homeArea: varchar("home_area", { length: 20 }),
    // Görev etiketi: COM | CX | COACH (nullable). Listede sıralama + filtre için.
    duty: varchar("duty", { length: 10 }),
    // Çalışma tipi: FT (full-time) | PT (part-time), nullable. Alan-içi sıralama
    // COM → FT → PT tiers'ında kullanılır.
    employment: varchar("employment", { length: 2 }),
    isManager: boolean("is_manager").notNull().default(false),
    isBlacklisted: boolean("is_blacklisted").notNull().default(false),
    note: text("note"),
    hireDate: date("hire_date"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    storeIdx: index("idx_staff_store").on(t.storeId),
    storeShortUnique: uniqueIndex("staff_store_short_name_unique").on(t.storeId, t.shortName),
  }),
);

export const competencies = pgTable(
  "competencies",
  {
    staffId: integer("staff_id")
      .notNull()
      .references(() => staff.id, { onDelete: "cascade" }),
    role: varchar("role", { length: 20 }).notNull(),
    level: integer("level").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.staffId, t.role] }),
    staffIdx: index("idx_competencies_staff").on(t.staffId),
  }),
);

export const solverConfig = pgTable("solver_config", {
  storeId: integer("store_id")
    .primaryKey()
    .references(() => stores.id),
  competencyWeight: real("competency_weight").notNull().default(2.0),
  fairnessWeight: real("fairness_weight").notNull().default(0.3),
  managerMorningPenalty: integer("manager_morning_penalty").notNull().default(50),
  managerNormalPenalty: integer("manager_normal_penalty").notNull().default(500),
  dualPenalty: integer("dual_penalty").notNull().default(100),
  sprinterDualPenalty: integer("sprinter_dual_penalty").notNull().default(300),
  buddyViolationPenalty: integer("buddy_violation_penalty").notNull().default(200),
  maxConsecutiveHours: integer("max_consecutive_hours").notNull().default(4),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const forbiddenRolePairs = pgTable(
  "forbidden_role_pairs",
  {
    storeId: integer("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    roleA: varchar("role_a", { length: 20 }).notNull(),
    roleB: varchar("role_b", { length: 20 }).notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.storeId, t.roleA, t.roleB] }),
  }),
);

export const charts = pgTable(
  "charts",
  {
    id: serial("id").primaryKey(),
    storeId: integer("store_id").references(() => stores.id),
    shiftDate: date("shift_date").notNull(),
    generatedAt: timestamp("generated_at", { withTimezone: true }).notNull().defaultNow(),
    userId: text("user_id"),
    shiftData: jsonb("shift_data").notNull(),
    chartData: jsonb("chart_data").notNull(),
    qualityScore: real("quality_score"),
    configSnapshot: jsonb("config_snapshot"),
    responsibilities: jsonb("responsibilities"),
    status: varchar("status", { length: 20 }).notNull().default("generated"),
  },
  (t) => ({
    storeDateIdx: index("idx_charts_store_date").on(t.storeId, t.shiftDate),
  }),
);

export const auditLog = pgTable("audit_log", {
  id: serial("id").primaryKey(),
  userId: text("user_id"),
  action: varchar("action", { length: 50 }).notNull(),
  entityType: varchar("entity_type", { length: 20 }),
  entityId: integer("entity_id"),
  changes: jsonb("changes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ════════════════════════════════════════════════════════════════════════════
//  ANALYTICS EVENTS — ürün analitiği (tekil ziyaretçi + tıklama/etkileşim)
//  audit_log "kim neyi DEĞİŞTİRDİ" (denetim) içindir; bu tablo "ziyaretçi neyi
//  GÖRDÜ/TIKLADI" (ürün analitiği) içindir — iki ayrı kaygı, ayrı tablo.
//  Tekil ziyaretçi: anonim `session_id` (tarayıcıda localStorage uuid) →
//  count(distinct session_id) ile "kaç kişi" (ham görüntülemeden ayrı).
//  Kişisel veri TUTULMAZ; session_id rastgele anonim kimliktir.
// ════════════════════════════════════════════════════════════════════════════
export const analyticsEvents = pgTable(
  "analytics_events",
  {
    id: serial("id").primaryKey(),
    // Anonim ziyaretçi kimliği (localStorage uuid). Tekil sayım buradan.
    sessionId: varchar("session_id", { length: 40 }).notNull(),
    // 'page_view' | 'click' | 'dwell' | … (genişletilebilir, enum'a kilitlenmedi).
    eventType: varchar("event_type", { length: 30 }).notNull(),
    path: varchar("path", { length: 200 }).notNull(), // rota/sayfa
    // click için tıklanan öğe etiketi/selektörü (örn "btn:generate", "nav:pusula").
    element: varchar("element", { length: 120 }),
    // serbest bağlam: {x, y, vw, dwellMs, …} — heatmap/koordinat için yer açar.
    meta: jsonb("meta"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    sessionIdx: index("idx_analytics_events_session").on(t.sessionId),
    typeCreatedIdx: index("idx_analytics_events_type_created").on(t.eventType, t.createdAt),
    pathIdx: index("idx_analytics_events_path").on(t.path),
  }),
);

// ════════════════════════════════════════════════════════════════════════════
//  BUENAS DIAS — sabah toplantı otomasyonu (modül)
//  Spec: ~/Desktop/buenas-dias-generator/buenas_dias_spec.md
//  "buenas_" öneki, mevcut `stores`/`staff` tablolarıyla isim çakışmasını engeller.
// ════════════════════════════════════════════════════════════════════════════

// Store seviyesi ayarlar — tek satır (storeId=1). Spec §2.1.
// PK aynı zamanda FK; her store için en fazla bir ayar satırı garanti edilir.
export const buenasStoreSettings = pgTable("buenas_store_settings", {
  storeId: integer("store_id")
    .primaryKey()
    .references(() => stores.id, { onDelete: "cascade" }),
  // Sabit aylık hedefler; 0 = "henüz girilmedi" anlamına gelir (UI uyarı verir).
  compranTarget: real("compran_target").notNull().default(0),
  gapTarget: real("gap_target").notNull().default(0),
  productivityTarget: real("productivity_target").notNull().default(0),
  // Motor A/B parametreleri — `coefficients` tablosundan ayrı tutuldu çünkü bunlar
  // kalibre edilmiyor, mağaza yönetimi tarafından bilinçli olarak ayarlanıyor.
  defaultStretch: real("default_stretch").notNull().default(0.03),
  weekendWeight: real("weekend_weight").notNull().default(1.75),
  weekendDayFactor: real("weekend_day_factor").notNull().default(1.3),
  city: varchar("city", { length: 100 }).notNull().default("Bornova,Izmir"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Motor A katsayıları — kalibre edilen değerler. Spec §2.2.
// Type sütunu unique; her katsayı tipi için tek satır.
export const coefficients = pgTable(
  "coefficients",
  {
    id: serial("id").primaryKey(),
    type: varchar("type", { length: 30 }).notNull().unique(),
    currentValue: real("current_value").notNull(),
    defaultValue: real("default_value").notNull(),
    sampleCount: integer("sample_count").notNull().default(0),
    // Sistem öneri ürettiğinde buraya yazar; kullanıcı onayladığında current'a kopyalanır.
    lastSuggestedValue: real("last_suggested_value"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    typeIdx: index("idx_coefficients_type").on(t.type),
  }),
);

// Aylık challenge — iki tier. Spec §2.3.
// tier2 = tier1 × 1.15; app-side türevlenir ama DB'de de tutarız (history için).
export const challenges = pgTable(
  "challenges",
  {
    id: serial("id").primaryKey(),
    storeId: integer("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    month: varchar("month", { length: 7 }).notNull(), // 'YYYY-MM'
    tier1TargetTl: real("tier1_target_tl").notNull(),
    tier2TargetTl: real("tier2_target_tl").notNull(),
    startDate: date("start_date").notNull(),
    endDate: date("end_date").notNull(),
    // TL'yi adede çevirmek için ortalama sepet; geçmiş veri yoksa kullanıcı girer.
    avgBasketTl: real("avg_basket_tl"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    storeMonthUnique: uniqueIndex("buenas_challenges_store_month_unique").on(
      t.storeId,
      t.month,
    ),
  }),
);

// Günlük kayıt — sistemin kalbi. Spec §2.4.
// Tek bir gün için: bağlam + hedef + referans + gerçekleşen, hepsi bir satırda.
// status TASLAK → ONAYLANDI → GERCEKLESTI durum zinciri (spec §3.5).
// Bu zincir, yarım verilerin kümülatif TL'ye karışmasını engeller.
export const dailyRecords = pgTable(
  "daily_records",
  {
    id: serial("id").primaryKey(),
    storeId: integer("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    date: date("date").notNull(),
    status: varchar("status", { length: 20 }).notNull().default("TASLAK"),

    // Bağlam alanları — Motor A bunları katsayı seçimi için kullanır.
    dayType: varchar("day_type", { length: 20 }).notNull(), // haftaici | haftasonu
    isSpecialDay: boolean("is_special_day").notNull().default(false),
    weather: varchar("weather", { length: 20 }).notNull().default("normal"), // sunny | normal | bad

    // Hedef alanları — Motor A üretir, yönetici onaylar.
    targetTotalAdet: integer("target_total_adet"),
    targetTotalTl: real("target_total_tl"),
    targetReyon: jsonb("target_reyon"), // ReyonGrid: 3×3 hücre
    targetIpod: jsonb("target_ipod"), // IpodGrid: 4 değer
    plannedSint: real("planned_sint"),

    // Referans alanları — 7 gün önceki kayıttan otomatik kopyalanır (reyon hariç).
    refTotalAdet: integer("ref_total_adet"),
    refTotalTl: real("ref_total_tl"),
    refVisit: integer("ref_visit"),
    refReyon: jsonb("ref_reyon"), // 9 hücre: reyon sorumluları elle girer

    // Gerçekleşen alanlar — akşam kapanışta girilir, sonra status=GERCEKLESTI.
    actualTotalAdet: integer("actual_total_adet"),
    actualTotalTl: real("actual_total_tl"),
    actualVisit: integer("actual_visit"),
    actualFis: integer("actual_fis"),
    actualSint: real("actual_sint"),
    actualGap: real("actual_gap"), // Zara uygulamasından elle girilir (spec §3.4)

    // Serbest metin.
    dearTeamKonusu: text("dear_team_konusu"),
    gununSozu: text("gunun_sozu"),

    // Audit zaman damgaları — durum zinciri geçişlerini takip eder.
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    closedAt: timestamp("closed_at", { withTimezone: true }),
  },
  (t) => ({
    storeDateUnique: uniqueIndex("buenas_daily_records_store_date_unique").on(
      t.storeId,
      t.date,
    ),
    statusIdx: index("idx_buenas_daily_records_status").on(t.status),
    dateIdx: index("idx_buenas_daily_records_date").on(t.date),
  }),
);

// Özel gün takvimi — Motor A'nın özel gün katsayısını uygulayacağı tarihler.
// Spec §2.5. Tek günler için startDate = endDate; aralıklar (Ramazan vb.) için
// endDate > startDate. Coefficient nullable değil — default 1.45'ten farklı
// olabilir (çok özel günler için).
export const specialDays = pgTable(
  "special_days",
  {
    id: serial("id").primaryKey(),
    storeId: integer("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 100 }).notNull(),
    startDate: date("start_date").notNull(),
    endDate: date("end_date").notNull(),
    coefficient: real("coefficient").notNull().default(1.45),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    storeDateIdx: index("idx_buenas_special_days_store_date").on(t.storeId, t.startDate),
  }),
);

// Kalibrasyon örnekleri — Motor A katsayılarının kalibrasyonu için
// (spec §3.2). Bir gün GERCEKLESTI'ye geçtiğinde, o günün dominant katsayısı
// için "gerçekte ne olurdu" değeri hesaplanıp burada saklanır. Ortalamayı
// türetmek için ham örnekler tutulur; sadece sample_count yeterli değil.
export const coefficientSamples = pgTable(
  "coefficient_samples",
  {
    id: serial("id").primaryKey(),
    storeId: integer("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    coefficientType: varchar("coefficient_type", { length: 30 }).notNull(),
    date: date("date").notNull(), // örneğin alındığı gün
    sampledValue: real("sampled_value").notNull(),
    appliedAt: timestamp("applied_at", { withTimezone: true }), // null = henüz uygulanmadı
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    typeIdx: index("idx_coefficient_samples_type").on(t.coefficientType, t.appliedAt),
    storeDateIdx: index("idx_coefficient_samples_store_date").on(t.storeId, t.date),
  }),
);

// Çoklu kullanıcı — Faz 5'te aktif olur, ama tablo Faz 0'da yaratılır ki
// sonradan migration patırtısı çıkmasın. Pin hash'i bcrypt ile saklanır.
// Spec §2.6.
export const buenasUsers = pgTable(
  "buenas_users",
  {
    id: serial("id").primaryKey(),
    storeId: integer("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 100 }).notNull(),
    role: varchar("role", { length: 30 }).notNull(),
    pinHash: text("pin_hash").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    storeRoleIdx: index("idx_buenas_users_store_role").on(t.storeId, t.role),
  }),
);

// ════════════════════════════════════════════════════════════════════════════
//  PUSULA — insan-gelişim motoru (Tanı → Geliştir → Yerleştir)
//  Kaynak modeli: src/pages/pusula/ (DEMO.md + data-*.ts). Bugün ekran TAMAMEN
//  local mock; bu tablolar onu GERÇEK staff tablosuna bağlar. Hepsi `pusula_`
//  önekli (mevcut `buenas_` deseni gibi) ve gerçek `staff.id`'ye FK'lar.
//
//  TASARIM KARARLARI (neden böyle):
//  • Pusula'nın string roster'ı ("Ada", "Baran") bilinçli TERK edildi — tek
//    doğruluk kaynağı `staff` tablosu olsun, iki roster senkron sorunu olmasın.
//  • Sert skor saklanmaz ama UI'ın türettiği NİTEL durumlar (unexplored/emerging/
//    proven + level) ve kanıt HACMİ (n) saklanır — "kanıt öneride durur" kuralı.
//  • Katalog tabloları (yetkinlik tanımı, kitapçık konuları, sözlük) referans
//    veridir, kişiye bağlı değildir; içerikleri seed ile ayrı doldurulur.
//  Bu faz: ŞEMA (başlıklar). İçerik (kişi-bazlı satırlar) sonraki fazda.
// ════════════════════════════════════════════════════════════════════════════

// ── KATALOG: 6 operasyonel yetkinlik tanımı (data-competency.ts COMP_KEYS) ──
// karsilama · kabin · dolum · sellthrough · urun · kayip. Çok dilli etiketler
// kodda zaten var; tabloda tutmak ileride yönetici düzenlemesine kapı açar.
export const pusulaCompetencies = pgTable("pusula_competencies", {
  key: varchar("key", { length: 30 }).primaryKey(), // 'karsilama' | 'kabin' | …
  labelTr: varchar("label_tr", { length: 120 }).notNull(),
  labelEn: varchar("label_en", { length: 120 }).notNull(),
  labelEs: varchar("label_es", { length: 120 }).notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

// ── Kişi × yetkinlik durumu (PersonCompetency) ──────────────────────────────
// state: unexplored (hiç denenmedi) | emerging (sinyal birikiyor) | proven.
// provenLevel sadece proven'da dolu: gelisiyor|yapabiliyor|guclu|usta.
// evidenceN = kanıt HACMİ (vardiya/olay sayısı), kişi skoru DEĞİL.
export const pusulaPersonCompetency = pgTable(
  "pusula_person_competency",
  {
    staffId: integer("staff_id")
      .notNull()
      .references(() => staff.id, { onDelete: "cascade" }),
    comp: varchar("comp", { length: 30 }).notNull(),
    state: varchar("state", { length: 20 }).notNull().default("unexplored"),
    provenLevel: varchar("proven_level", { length: 20 }), // null = proven değil
    teachable: boolean("teachable").notNull().default(false),
    evidenceN: integer("evidence_n").notNull().default(0),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.staffId, t.comp] }),
  }),
);

// ── Kanıt kayıtları (Evidence) — yetkinliği besleyen ham sinyaller ──────────
// channel: counter|attribution|booklet|eas|coach. Her kayıt bir kanıt olayı;
// person_competency.evidence_n bunların türevidir (cache).
export const pusulaEvidence = pgTable(
  "pusula_evidence",
  {
    id: serial("id").primaryKey(),
    staffId: integer("staff_id")
      .notNull()
      .references(() => staff.id, { onDelete: "cascade" }),
    comp: varchar("comp", { length: 30 }).notNull(),
    channel: varchar("channel", { length: 20 }).notNull(),
    n: integer("n").notNull().default(1), // bu kayıttaki vardiya/olay hacmi
    line: text("line"), // serbest açıklama (UI'daki kanıt satırı)
    observedAt: date("observed_at"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    staffCompIdx: index("idx_pusula_evidence_staff_comp").on(t.staffId, t.comp),
  }),
);

// ── Aptitude döngüsü: kanıt → öneri → koç onayı (AptitudeSuggestion) ─────────
// Orquest aptitude'unu bugün yönetici kanaatle girer; Pusula kanıt birikince
// güncelleme ÖNERİR, koç onaylar. status: pending → approved.
export const pusulaAptitudeSuggestions = pgTable(
  "pusula_aptitude_suggestions",
  {
    id: serial("id").primaryKey(),
    staffId: integer("staff_id")
      .notNull()
      .references(() => staff.id, { onDelete: "cascade" }),
    comp: varchar("comp", { length: 30 }).notNull(),
    fromLevel: varchar("from_level", { length: 20 }).notNull(),
    toLevel: varchar("to_level", { length: 20 }).notNull(),
    evidenceChannel: varchar("evidence_channel", { length: 20 }),
    evidenceN: integer("evidence_n"),
    status: varchar("status", { length: 20 }).notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    approvedBy: text("approved_by"),
  },
  (t) => ({
    staffStatusIdx: index("idx_pusula_aptitude_staff_status").on(t.staffId, t.status),
  }),
);

// ── KATALOG: Gelişim Defteri konuları (GuidebookTopic) ──────────────────────
// Gerçek kitapçık topic'leri. role × level × category. Kişiye bağlı DEĞİL.
export const pusulaGuidebookTopics = pgTable(
  "pusula_guidebook_topics",
  {
    id: serial("id").primaryKey(),
    role: varchar("role", { length: 30 }).notNull(), // Satış Danışmanı | Kasa | Operasyon
    level: varchar("level", { length: 20 }).notNull(), // Başlangıç | Orta | İleri
    category: varchar("category", { length: 30 }).notNull(),
    no: integer("no").notNull(),
    title: text("title").notNull(),
  },
  (t) => ({
    roleLevelIdx: index("idx_pusula_guidebook_topics_role_level").on(t.role, t.level),
  }),
);

// ── Kişi × konu ilerlemesi (GuidebookTopic.status) ──────────────────────────
// status: Boş | Teorik | Yapabiliyor | Geliştirilmeli | Öğretebilir.
export const pusulaGuidebookProgress = pgTable(
  "pusula_guidebook_progress",
  {
    staffId: integer("staff_id")
      .notNull()
      .references(() => staff.id, { onDelete: "cascade" }),
    topicId: integer("topic_id")
      .notNull()
      .references(() => pusulaGuidebookTopics.id, { onDelete: "cascade" }),
    status: varchar("status", { length: 20 }).notNull().default("Boş"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.staffId, t.topicId] }),
  }),
);

// ── Davranışsal yetkinlik değerlendirmesi (CompetencyRow) ───────────────────
// 5 davranışsal yetkinlik × 4 dönem (Hafta 2/4/6/8). score 0–5 (ekranda etiket).
// priority = "Eğitim Önceliği" işareti.
export const pusulaCompetencyEvals = pgTable(
  "pusula_competency_evals",
  {
    id: serial("id").primaryKey(),
    staffId: integer("staff_id")
      .notNull()
      .references(() => staff.id, { onDelete: "cascade" }),
    competency: varchar("competency", { length: 80 }).notNull(),
    week: varchar("week", { length: 12 }).notNull(), // 'Hafta 2' | 'Hafta 4' | …
    score: integer("score").notNull().default(0), // 0–5
    priority: boolean("priority").notNull().default(false),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    staffCompWeekUnique: uniqueIndex("pusula_comp_eval_staff_comp_week_unique").on(
      t.staffId,
      t.competency,
      t.week,
    ),
  }),
);

// ── Dönem aksiyon planı (PeriodAction) ──────────────────────────────────────
// Hafta 2/4/6/8 öncelik → hedef → aksiyon + provenance (kanıt zinciri jsonb).
export const pusulaPeriodActions = pgTable(
  "pusula_period_actions",
  {
    id: serial("id").primaryKey(),
    staffId: integer("staff_id")
      .notNull()
      .references(() => staff.id, { onDelete: "cascade" }),
    week: varchar("week", { length: 12 }).notNull(),
    priorities: jsonb("priorities"), // string[]
    goal: text("goal"),
    action: text("action"),
    provenance: jsonb("provenance"), // ActionProvenance (signal/channel/inference/…)
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    staffWeekIdx: index("idx_pusula_period_actions_staff_week").on(t.staffId, t.week),
  }),
);

// ── Öğrenen Hafıza: koçluk gözlem arşivi (ArchiveNote) ──────────────────────
// kind: Gözlem | Koçluk | Değerlendirme. tone: developing|steady|strong (SOFT).
// signed = koç imzaladı mı (çıkar-sonra-onayla akışı).
export const pusulaArchiveNotes = pgTable(
  "pusula_archive_notes",
  {
    id: serial("id").primaryKey(),
    staffId: integer("staff_id")
      .notNull()
      .references(() => staff.id, { onDelete: "cascade" }),
    date: date("date").notNull(),
    kind: varchar("kind", { length: 20 }).notNull(),
    topic: varchar("topic", { length: 120 }),
    note: text("note").notNull(),
    author: varchar("author", { length: 100 }),
    signed: boolean("signed").notNull().default(false),
    tone: varchar("tone", { length: 20 }), // developing | steady | strong
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    staffDateIdx: index("idx_pusula_archive_notes_staff_date").on(t.staffId, t.date),
  }),
);

// ── Usta Yolu: mentor eşleşmesi (MentorMatch) ───────────────────────────────
// mentor & mentee ikisi de staff. Koç da mentee olabilir (eğitimcinin eğitimi).
// confidence SOFT (emerging|medium|high), match-score yüzdesi YOK.
export const pusulaMentorMatches = pgTable(
  "pusula_mentor_matches",
  {
    id: serial("id").primaryKey(),
    mentorId: integer("mentor_id")
      .notNull()
      .references(() => staff.id, { onDelete: "cascade" }),
    menteeId: integer("mentee_id")
      .notNull()
      .references(() => staff.id, { onDelete: "cascade" }),
    focus: text("focus"),
    reason: text("reason"),
    shift: varchar("shift", { length: 60 }),
    slot: varchar("slot", { length: 60 }), // müsait (slack) saat
    confidence: varchar("confidence", { length: 20 }),
    aiSuggested: boolean("ai_suggested").notNull().default(true),
    status: varchar("status", { length: 20 }).notNull().default("suggested"), // suggested|approved|edited
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    mentorIdx: index("idx_pusula_mentor_matches_mentor").on(t.mentorId),
    menteeIdx: index("idx_pusula_mentor_matches_mentee").on(t.menteeId),
  }),
);

// ── Dönem / final raporu (FinalReport) ──────────────────────────────────────
export const pusulaReports = pgTable(
  "pusula_reports",
  {
    id: serial("id").primaryKey(),
    staffId: integer("staff_id")
      .notNull()
      .references(() => staff.id, { onDelete: "cascade" }),
    period: varchar("period", { length: 30 }).notNull(), // 'Hafta 8' | '2026-Q2' …
    strengths: jsonb("strengths"), // string[]
    growth: jsonb("growth"), // string[]
    result: text("result"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    staffPeriodIdx: index("idx_pusula_reports_staff_period").on(t.staffId, t.period),
  }),
);

// ── KATALOG: Sözlük (GlossaryTerm) ──────────────────────────────────────────
export const pusulaGlossary = pgTable("pusula_glossary", {
  id: serial("id").primaryKey(),
  term: varchar("term", { length: 120 }).notNull(),
  type: varchar("type", { length: 40 }),
  definition: text("definition").notNull(),
});
