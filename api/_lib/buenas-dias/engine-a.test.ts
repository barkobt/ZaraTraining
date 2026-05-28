/**
 * Motor A birim testleri — spec §3.1.
 *
 * Test stratejisi: Motor saf bir fonksiyon, DB/HTTP yok. Doğrudan girdi/çıktı
 * karşılaştırması; kayan nokta için `toBeCloseTo` (ondalık 2-4 hane).
 */
import { describe, it, expect } from "vitest";
import {
  calculateCell,
  calculateDay,
  calculateReyonGrid,
  type DayContext,
  type EngineCoefficients,
} from "./engine-a.js";
import {
  DEFAULT_COEFFICIENTS,
  emptyReyonGrid,
  type ReyonGrid,
} from "../../../contracts/buenas-dias.js";

// Default katsayılar — spec'teki başlangıç değerleri.
const DEFAULT_COEFS: EngineCoefficients = {
  stretch: DEFAULT_COEFFICIENTS.stretch, // 1.03
  weekend: DEFAULT_COEFFICIENTS.weekend, // 1.30
  weatherSunny: DEFAULT_COEFFICIENTS.weather_sunny, // 1.15
  weatherNormal: DEFAULT_COEFFICIENTS.weather_normal, // 1.00
  weatherBad: DEFAULT_COEFFICIENTS.weather_bad, // 0.85
  specialDay: DEFAULT_COEFFICIENTS.special_day, // 1.45
};

const CTX_WEEKDAY_NORMAL: DayContext = {
  dayType: "haftaici",
  isSpecialDay: false,
  weather: "normal",
};

const CTX_WEEKEND_NORMAL: DayContext = {
  dayType: "haftasonu",
  isSpecialDay: false,
  weather: "normal",
};

describe("Motor A — calculateCell", () => {
  it("spec örneği: 4056 × 1.03 × 1.0 × 1.0 × 1.0 ≈ 4178", () => {
    const bd = calculateCell(4056, CTX_WEEKDAY_NORMAL, DEFAULT_COEFS);
    expect(bd.value).toBeCloseTo(4177.68, 2);
    expect(bd.ref).toBe(4056);
    expect(bd.stretch).toBe(1.03);
    expect(bd.weekend).toBe(1); // haftaiçi
    expect(bd.specialDay).toBe(1); // özel gün yok
    expect(bd.weather).toBe(1); // normal
  });

  it("haftasonu çarpanı (1.30) tek başına uygulanır", () => {
    const bd = calculateCell(1000, CTX_WEEKEND_NORMAL, DEFAULT_COEFS);
    expect(bd.weekend).toBe(1.3);
    expect(bd.value).toBeCloseTo(1000 * 1.03 * 1.3, 4); // = 1339
  });

  it("haftasonu × özel gün = 1.30 × 1.45 = 1.885 (spec §3.1 örneği)", () => {
    const bd = calculateCell(1000, {
      dayType: "haftasonu",
      isSpecialDay: true,
      weather: "normal",
    }, DEFAULT_COEFS);
    // stretch dahil değil, sadece weekend × specialDay
    expect(bd.weekend * bd.specialDay).toBeCloseTo(1.885, 4);
    // Tam çarpım: 1000 × 1.03 × 1.30 × 1.45 × 1.00
    expect(bd.value).toBeCloseTo(1000 * 1.03 * 1.3 * 1.45 * 1.0, 4);
  });

  it("özel günün kendi katsayısı global'i ezer", () => {
    const bd = calculateCell(1000, {
      dayType: "haftaici",
      isSpecialDay: true,
      specialDayCoefficient: 1.8, // Black Friday gibi
      weather: "normal",
    }, DEFAULT_COEFS);
    expect(bd.specialDay).toBe(1.8); // global 1.45 değil
  });

  it("isSpecialDay false ise specialDayCoefficient yok sayılır", () => {
    const bd = calculateCell(1000, {
      dayType: "haftaici",
      isSpecialDay: false,
      specialDayCoefficient: 1.8, // varlığı önemli değil
      weather: "normal",
    }, DEFAULT_COEFS);
    expect(bd.specialDay).toBe(1);
  });

  it("hava katsayıları doğru seçilir", () => {
    const sunny = calculateCell(1000, { ...CTX_WEEKDAY_NORMAL, weather: "sunny" }, DEFAULT_COEFS);
    expect(sunny.weather).toBe(1.15);

    const bad = calculateCell(1000, { ...CTX_WEEKDAY_NORMAL, weather: "bad" }, DEFAULT_COEFS);
    expect(bad.weather).toBe(0.85);
  });

  it("ref=0 → value=0 (hata vermez)", () => {
    const bd = calculateCell(0, CTX_WEEKDAY_NORMAL, DEFAULT_COEFS);
    expect(bd.value).toBe(0);
  });
});

describe("Motor A — calculateReyonGrid (9 hücre)", () => {
  it("her hücreye aynı katsayılar uygulanır, breakdown 9 kayıt döner", () => {
    const ref: ReyonGrid = {
      kadin: { tekstil: 100, tempe: 50, parfum: 20 },
      erkek: { tekstil: 80, tempe: 30, parfum: 15 },
      cocuk: { tekstil: 60, tempe: 20, parfum: 10 },
    };
    const { targets, breakdowns } = calculateReyonGrid(ref, CTX_WEEKDAY_NORMAL, DEFAULT_COEFS);

    // Her hücre = ref × 1.03 × 1 × 1 × 1
    expect(targets.kadin.tekstil).toBeCloseTo(103, 4);
    expect(targets.erkek.tempe).toBeCloseTo(30 * 1.03, 4);
    expect(targets.cocuk.parfum).toBeCloseTo(10 * 1.03, 4);

    // 9 breakdown anahtarı
    expect(Object.keys(breakdowns)).toHaveLength(9);
    expect(breakdowns["kadin.tekstil"].ref).toBe(100);
  });

  it("eksik hücre 0 sayılır (boş grid'le)", () => {
    const ref = emptyReyonGrid();
    const { targets } = calculateReyonGrid(ref, CTX_WEEKDAY_NORMAL, DEFAULT_COEFS);
    expect(targets.kadin.tekstil).toBe(0);
    expect(targets.cocuk.parfum).toBe(0);
  });
});

describe("Motor A — calculateDay", () => {
  const ref = {
    totalAdet: 4056,
    totalTl: 200000,
    reyon: {
      kadin: { tekstil: 1000, tempe: 200, parfum: 100 },
      erkek: { tekstil: 800, tempe: 150, parfum: 80 },
      cocuk: { tekstil: 600, tempe: 100, parfum: 50 },
    } as ReyonGrid,
  };

  it("targetTotalAdet, 9 hücrenin toplamıdır (kasıtlı tutarlılık)", () => {
    const out = calculateDay({
      ref,
      ctx: CTX_WEEKDAY_NORMAL,
      coefs: DEFAULT_COEFS,
    });
    // 9 hücre toplamı = (1000+200+100+800+150+80+600+100+50) × 1.03 = 3080 × 1.03
    const expected9Sum = (1000 + 200 + 100 + 800 + 150 + 80 + 600 + 100 + 50) * 1.03;
    expect(out.targetTotalAdet).toBeCloseTo(expected9Sum, 4);
  });

  it("targetTotalTl bağımsız ref'le hesaplanır (200000 × 1.03)", () => {
    const out = calculateDay({
      ref,
      ctx: CTX_WEEKDAY_NORMAL,
      coefs: DEFAULT_COEFS,
    });
    expect(out.targetTotalTl).toBeCloseTo(200000 * 1.03, 2);
  });

  it("plannedSint yoksa productivityBeklenen null", () => {
    const out = calculateDay({ ref, ctx: CTX_WEEKDAY_NORMAL, coefs: DEFAULT_COEFS });
    expect(out.productivityBeklenen).toBeNull();
  });

  it("plannedSint=100 → productivityBeklenen = targetTotalAdet / 100", () => {
    const out = calculateDay({
      ref,
      ctx: CTX_WEEKDAY_NORMAL,
      coefs: DEFAULT_COEFS,
      plannedSint: 100,
    });
    expect(out.productivityBeklenen).toBeCloseTo(out.targetTotalAdet / 100, 4);
  });

  it("ipod referansı yoksa targetIpod null", () => {
    const out = calculateDay({ ref, ctx: CTX_WEEKDAY_NORMAL, coefs: DEFAULT_COEFS });
    expect(out.targetIpod).toBeNull();
  });

  it("ipod referansı varsa 4 kategori için ayrı katsayı uygulanır", () => {
    const out = calculateDay({
      ref: { ...ref, ipod: { kadin: 20, erkek: 15, cocuk: 10, kasa: 5 } },
      ctx: CTX_WEEKDAY_NORMAL,
      coefs: DEFAULT_COEFS,
    });
    expect(out.targetIpod).not.toBeNull();
    expect(out.targetIpod!.kadin).toBeCloseTo(20 * 1.03, 4);
    expect(out.targetIpod!.kasa).toBeCloseTo(5 * 1.03, 4);
  });

  it("haftasonu × güneşli birleşik hesap (1.03 × 1.30 × 1.15)", () => {
    const out = calculateDay({
      ref,
      ctx: { dayType: "haftasonu", isSpecialDay: false, weather: "sunny" },
      coefs: DEFAULT_COEFS,
    });
    const expectedTl = 200000 * 1.03 * 1.3 * 1.15;
    expect(out.targetTotalTl).toBeCloseTo(expectedTl, 2);
  });

  it("breakdown haritasında reyon.*, total.*, ipod.* anahtarları beklenir", () => {
    const out = calculateDay({
      ref: { ...ref, ipod: { kadin: 1, erkek: 1, cocuk: 1, kasa: 1 } },
      ctx: CTX_WEEKDAY_NORMAL,
      coefs: DEFAULT_COEFS,
    });
    expect(out.breakdowns["total.adet"]).toBeDefined();
    expect(out.breakdowns["total.tl"]).toBeDefined();
    expect(out.breakdowns["reyon.kadin.tekstil"]).toBeDefined();
    expect(out.breakdowns["reyon.cocuk.parfum"]).toBeDefined();
    expect(out.breakdowns["ipod.kasa"]).toBeDefined();
    // 9 reyon + 2 total + 4 ipod = 15
    expect(Object.keys(out.breakdowns)).toHaveLength(15);
  });
});
