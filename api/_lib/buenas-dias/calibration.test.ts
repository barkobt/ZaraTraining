import { describe, it, expect } from "vitest";
import {
  pickDominantCoefficient,
  computeSampleValue,
  computeAverage,
  CALIBRATION_MIN_SAMPLES,
} from "./calibration.js";

describe("pickDominantCoefficient — öncelik sırası", () => {
  it("özel gün her şeyden önce gelir", () => {
    expect(
      pickDominantCoefficient({ dayType: "haftasonu", isSpecialDay: true, weather: "sunny" }),
    ).toBe("special_day");
  });

  it("özel gün yoksa, hava 'sunny' kazanır", () => {
    expect(
      pickDominantCoefficient({ dayType: "haftasonu", isSpecialDay: false, weather: "sunny" }),
    ).toBe("weather_sunny");
  });

  it("özel gün yoksa, hava 'bad' kazanır", () => {
    expect(
      pickDominantCoefficient({ dayType: "haftaici", isSpecialDay: false, weather: "bad" }),
    ).toBe("weather_bad");
  });

  it("özel gün ve aşırı hava yoksa haftasonu kazanır", () => {
    expect(
      pickDominantCoefficient({ dayType: "haftasonu", isSpecialDay: false, weather: "normal" }),
    ).toBe("weekend");
  });

  it("hiçbiri yoksa stretch (her gün uygulanır)", () => {
    expect(
      pickDominantCoefficient({ dayType: "haftaici", isSpecialDay: false, weather: "normal" }),
    ).toBe("stretch");
  });
});

describe("computeSampleValue — spec §3.2 örneği", () => {
  it("1.45 × (5900/5000) ≈ 1.711", () => {
    expect(computeSampleValue(1.45, 5900, 5000)).toBeCloseTo(1.711, 3);
  });

  it("hedef aşılmadıysa katsayı küçülür (1.45 × 0.9 = 1.305)", () => {
    expect(computeSampleValue(1.45, 4500, 5000)).toBeCloseTo(1.305, 3);
  });

  it("hedef tam tutarsa katsayı sabit kalır", () => {
    expect(computeSampleValue(1.45, 5000, 5000)).toBeCloseTo(1.45, 4);
  });

  it("targetTotalTl null → null", () => {
    expect(computeSampleValue(1.45, 5000, null)).toBeNull();
  });

  it("actualTotalTl null → null", () => {
    expect(computeSampleValue(1.45, null, 5000)).toBeNull();
  });

  it("targetTotalTl 0 → null (bölme güvenli)", () => {
    expect(computeSampleValue(1.45, 5000, 0)).toBeNull();
  });

  it("currentValue 0 → null (anlamsız)", () => {
    expect(computeSampleValue(0, 5000, 4000)).toBeNull();
  });
});

describe("computeAverage", () => {
  it("3 örnek altı → null", () => {
    expect(computeAverage([1.5, 1.6])).toBeNull();
    expect(computeAverage([])).toBeNull();
  });

  it("3 örnek tam → ortalama", () => {
    expect(computeAverage([1.5, 1.6, 1.7])).toBeCloseTo(1.6, 4);
  });

  it("daha fazla örnek → düz ortalama", () => {
    expect(computeAverage([1.0, 2.0, 3.0, 4.0, 5.0])).toBeCloseTo(3.0, 4);
  });

  it("eşik sabiti 3 (spec §3.2)", () => {
    expect(CALIBRATION_MIN_SAMPLES).toBe(3);
  });
});
