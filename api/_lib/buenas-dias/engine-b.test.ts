import { describe, it, expect } from "vitest";
import {
  calculateChallenge,
  compareToTarget,
  computeRemainingDays,
  type EngineBInput,
} from "./engine-b.js";

const DEFAULT_WEEKEND_WEIGHT = 1.75;

function makeInput(overrides: Partial<EngineBInput>): EngineBInput {
  return {
    tierTargetTl: 150_000_000,
    cumulativeTl: 0,
    remainingDays: [],
    today: "2026-05-28",
    weekendWeight: DEFAULT_WEEKEND_WEIGHT,
    avgBasketTl: null,
    ...overrides,
  };
}

describe("Motor B — computeRemainingDays", () => {
  it("aynı gün → tek elemanlı liste", () => {
    const days = computeRemainingDays("2026-05-28", "2026-05-28");
    expect(days).toHaveLength(1);
    expect(days[0].date).toBe("2026-05-28");
    // 28 Mayıs 2026 = Perşembe → haftaiçi
    expect(days[0].isWeekend).toBe(false);
  });

  it("today > endDate → boş dizi", () => {
    const days = computeRemainingDays("2026-05-30", "2026-05-28");
    expect(days).toHaveLength(0);
  });

  it("hafta sonları doğru işaretlenir (Cmt/Paz)", () => {
    // 2026-05-29 Cuma → 2026-05-31 Pazar arası
    const days = computeRemainingDays("2026-05-29", "2026-05-31");
    expect(days.map((d) => d.isWeekend)).toEqual([false, true, true]);
  });
});

describe("Motor B — calculateChallenge spec senaryosu (§8 Faz 2)", () => {
  // Hedef 150M, kümülatif 95M, 11 gün kala (8 haftaiçi + 3 haftasonu)
  // → toplam_ağırlık = 8 + 3×1.75 = 13.25
  // → unit = 55M / 13.25 ≈ 4.150943M
  // → haftaiçi ≈ 4.15M, haftasonu ≈ 7.26M
  it("haftaiçi gününde gereken TL ≈ 4.15M", () => {
    const remainingDays = [
      ...Array.from({ length: 8 }, (_, i) => ({
        date: `2026-05-${20 + i}`,
        isWeekend: false,
      })),
      { date: "2026-05-28", isWeekend: true }, // simulate
      { date: "2026-05-29", isWeekend: true },
      { date: "2026-05-30", isWeekend: true },
    ];
    const input = makeInput({
      tierTargetTl: 150_000_000,
      cumulativeTl: 95_000_000,
      remainingDays,
      today: "2026-05-20", // ilk haftaiçi
    });
    const out = calculateChallenge(input);
    expect(out.remainingTl).toBe(55_000_000);
    expect(out.totalWeight).toBeCloseTo(8 + 3 * 1.75, 4); // 13.25
    expect(out.unitValue).toBeCloseTo(55_000_000 / 13.25, 0);
    expect(out.todayWeight).toBe(1);
    expect(out.todayRequiredTl).toBeCloseTo(4_150_943.4, 0);
  });

  it("haftasonu gününde gereken TL ≈ 7.26M (haftaiçi × 1.75)", () => {
    const remainingDays = [
      ...Array.from({ length: 8 }, (_, i) => ({
        date: `2026-05-${20 + i}`,
        isWeekend: false,
      })),
      { date: "2026-05-28", isWeekend: true },
      { date: "2026-05-29", isWeekend: true },
      { date: "2026-05-30", isWeekend: true },
    ];
    const input = makeInput({
      tierTargetTl: 150_000_000,
      cumulativeTl: 95_000_000,
      remainingDays,
      today: "2026-05-29", // haftasonu
    });
    const out = calculateChallenge(input);
    expect(out.todayWeight).toBe(1.75);
    expect(out.todayRequiredTl).toBeCloseTo((55_000_000 / 13.25) * 1.75, 0);
    expect(out.todayRequiredTl).toBeCloseTo(7_264_150.9, 0);
  });
});

describe("Motor B — edge cases", () => {
  it("kümülatif >= hedef → alreadyMet, gereken TL = 0", () => {
    const out = calculateChallenge(
      makeInput({
        tierTargetTl: 100_000_000,
        cumulativeTl: 120_000_000,
        remainingDays: [{ date: "2026-05-28", isWeekend: false }],
        today: "2026-05-28",
      }),
    );
    expect(out.alreadyMet).toBe(true);
    expect(out.remainingTl).toBe(-20_000_000);
    expect(out.todayRequiredTl).toBe(0);
  });

  it("kalan gün yok → totalWeight=0, gereken TL=0 (bölme güvenli)", () => {
    const out = calculateChallenge(
      makeInput({
        tierTargetTl: 100_000_000,
        cumulativeTl: 50_000_000,
        remainingDays: [],
        today: "2026-05-28",
      }),
    );
    expect(out.totalWeight).toBe(0);
    expect(out.unitValue).toBe(0);
    expect(out.todayRequiredTl).toBe(0);
  });

  it("avgBasketTl null → todayRequiredAdet null", () => {
    const out = calculateChallenge(
      makeInput({
        cumulativeTl: 95_000_000,
        remainingDays: [{ date: "2026-05-28", isWeekend: false }],
        today: "2026-05-28",
        avgBasketTl: null,
      }),
    );
    expect(out.todayRequiredAdet).toBeNull();
  });

  it("avgBasketTl > 0 → adet = TL / avgBasket", () => {
    const out = calculateChallenge(
      makeInput({
        tierTargetTl: 100_000_000,
        cumulativeTl: 0,
        remainingDays: [{ date: "2026-05-28", isWeekend: false }],
        today: "2026-05-28",
        avgBasketTl: 1000,
      }),
    );
    // tek gün → todayRequiredTl = remainingTl × 1 = 100M
    expect(out.todayRequiredTl).toBe(100_000_000);
    expect(out.todayRequiredAdet).toBe(100_000);
  });

  it("statusPct = kümülatif / hedef", () => {
    const out = calculateChallenge(
      makeInput({
        tierTargetTl: 150_000_000,
        cumulativeTl: 95_000_000,
        remainingDays: [{ date: "2026-05-28", isWeekend: false }],
        today: "2026-05-28",
      }),
    );
    expect(out.statusPct).toBeCloseTo(95 / 150, 4); // ≈ 0.633
  });

  it("today listede yoksa → todayWeight=0, todayRequired=0", () => {
    const out = calculateChallenge(
      makeInput({
        tierTargetTl: 100_000_000,
        cumulativeTl: 50_000_000,
        remainingDays: [{ date: "2026-05-30", isWeekend: false }],
        today: "2026-06-15", // listede yok
      }),
    );
    expect(out.todayWeight).toBe(0);
    expect(out.todayRequiredTl).toBe(0);
  });
});

describe("Motor B — compareToTarget", () => {
  it("Motor A >= Motor B → tutuyor", () => {
    const r = compareToTarget({ motorATargetTotalTl: 5_000_000, motorBTodayRequiredTl: 4_150_000 });
    expect(r.status).toBe("tutuyor");
    expect(r.diff).toBe(850_000);
  });

  it("Motor A < Motor B → acik, diff negatif", () => {
    const r = compareToTarget({ motorATargetTotalTl: 4_000_000, motorBTodayRequiredTl: 5_000_000 });
    expect(r.status).toBe("acik");
    expect(r.diff).toBe(-1_000_000);
  });

  it("Motor A null → yok (henüz hesaplanmamış)", () => {
    const r = compareToTarget({ motorATargetTotalTl: null, motorBTodayRequiredTl: 5_000_000 });
    expect(r.status).toBe("yok");
    expect(r.diff).toBeNull();
  });
});
