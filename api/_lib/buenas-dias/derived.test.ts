import { describe, it, expect } from "vitest";
import {
  calculateCompran,
  calculateProductivity,
  calculateGapFromChanges,
  compareMetric,
  compareGap,
} from "./derived.js";

describe("calculateCompran", () => {
  it("fiş 200 / visit 1000 = 0.20", () => {
    expect(calculateCompran(200, 1000)).toBe(0.2);
  });

  it("visit 0 → null (bölme güvenli)", () => {
    expect(calculateCompran(200, 0)).toBeNull();
  });

  it("visit null → null", () => {
    expect(calculateCompran(200, null)).toBeNull();
  });

  it("fiş null → null", () => {
    expect(calculateCompran(null, 1000)).toBeNull();
  });

  it("negatif visit → null (geçersiz)", () => {
    expect(calculateCompran(100, -10)).toBeNull();
  });
});

describe("calculateProductivity", () => {
  it("3000 adet / 100 saat = 30", () => {
    expect(calculateProductivity(3000, 100)).toBe(30);
  });

  it("sint null → null (opsiyonel alan)", () => {
    expect(calculateProductivity(3000, null)).toBeNull();
  });

  it("sint 0 → null", () => {
    expect(calculateProductivity(3000, 0)).toBeNull();
  });

  it("adet null → null", () => {
    expect(calculateProductivity(null, 100)).toBeNull();
  });
});

describe("calculateGapFromChanges", () => {
  it("satış 15%, visit 10% → Gap = +5", () => {
    expect(calculateGapFromChanges(10, 15)).toBe(5);
  });

  it("satış 5%, visit 10% → Gap = −5 (trafik kazanılmamış)", () => {
    expect(calculateGapFromChanges(10, 5)).toBe(-5);
  });

  it("ikisi de null → null", () => {
    expect(calculateGapFromChanges(null, null)).toBeNull();
  });

  it("biri null → null", () => {
    expect(calculateGapFromChanges(10, null)).toBeNull();
    expect(calculateGapFromChanges(null, 10)).toBeNull();
  });
});

describe("compareMetric (Compran/Productivity)", () => {
  it("aktüel hedeften yüksek → tutuyor", () => {
    const r = compareMetric(0.22, 0.2);
    expect(r.status).toBe("tutuyor");
    expect(r.diff).toBeCloseTo(0.02, 4);
  });

  it("aktüel hedeften düşük → altında", () => {
    const r = compareMetric(0.18, 0.2);
    expect(r.status).toBe("altinda");
    expect(r.diff).toBeCloseTo(-0.02, 4);
  });

  it("aktüel null → yok", () => {
    const r = compareMetric(null, 0.2);
    expect(r.status).toBe("yok");
    expect(r.diff).toBeNull();
  });

  it("hedef 0 (girilmemiş) → yok", () => {
    const r = compareMetric(0.22, 0);
    expect(r.status).toBe("yok");
    expect(r.diff).toBeNull();
  });
});

describe("compareGap", () => {
  it("aktüel Gap +3, hedef +2 → tutuyor", () => {
    const r = compareGap(3, 2);
    expect(r.status).toBe("tutuyor");
    expect(r.diff).toBe(1);
  });

  it("aktüel Gap −5, hedef 0 → altında", () => {
    const r = compareGap(-5, 0);
    expect(r.status).toBe("altinda");
    expect(r.diff).toBe(-5);
  });

  it("aktüel ve hedef eşit → tutuyor (>=)", () => {
    const r = compareGap(0, 0);
    expect(r.status).toBe("tutuyor");
  });

  it("aktüel null → yok", () => {
    const r = compareGap(null, 0);
    expect(r.status).toBe("yok");
  });
});
