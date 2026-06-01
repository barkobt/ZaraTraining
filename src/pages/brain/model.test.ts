import { describe, it, expect } from "vitest";
import {
  confidence, predictLoad, loadByBlock, scorePlan, predictAttainment,
  updateWeights, learnWeights, meanAbsError, mentorMatch, rankForZone,
  type Objective,
} from "./model";
import {
  ROSTER, BLOCKS, PLAN, HISTORY, INITIAL_WEIGHTS, CHEMISTRY, TODAY,
} from "./data";

describe("confidence", () => {
  it("kanıt arttıkça monoton artar, 0..1 arası", () => {
    expect(confidence(0)).toBe(0);
    expect(confidence(5)).toBeGreaterThan(confidence(2));
    expect(confidence(100)).toBeLessThanOrEqual(1);
  });
});

describe("predictLoad", () => {
  it("geçmiş Cuma'lardan zirveyi 19:00 (indeks 9) civarında bulur", () => {
    const load = predictLoad(HISTORY, { weekday: TODAY.weekday, payweek: TODAY.payweek });
    expect(load.hourly).toHaveLength(12);
    expect(load.peakIndex).toBe(9);
    expect(load.peakLabel).toBe("19:00");
    expect(load.support).toBeGreaterThan(0);
  });
});

describe("scorePlan", () => {
  it("net = tüm hücre lift'lerinin toplamı", () => {
    const load = predictLoad(HISTORY, { weekday: TODAY.weekday, payweek: TODAY.payweek });
    const bl = loadByBlock(load, BLOCKS);
    const { rows, net } = scorePlan(ROSTER, PLAN, BLOCKS, bl);
    const sumCells = rows.reduce(
      (s, r) => s + Object.values(r.cells).reduce((a, c) => a + (c?.lift ?? 0), 0),
      0,
    );
    expect(net).toBeCloseTo(Math.round(sumCells * 10) / 10, 1);
    expect(net).toBeGreaterThan(0);
  });
});

describe("updateWeights — kapalı döngü öğrenmesi", () => {
  it("tek adımda tahmin hatasını azaltır", () => {
    const day = HISTORY[2];
    const before = Math.abs(day.bdActual! - predictAttainment(INITIAL_WEIGHTS, day.satisfaction));
    const w2 = updateWeights(INITIAL_WEIGHTS, { satisfaction: day.satisfaction, bdActual: day.bdActual! });
    const after = Math.abs(day.bdActual! - predictAttainment(w2, day.satisfaction));
    expect(after).toBeLessThanOrEqual(before);
  });

  it("ağırlıklar her zaman 1'e normalize kalır", () => {
    const w = learnWeights(INITIAL_WEIGHTS, HISTORY).weights;
    const sum = (Object.keys(w) as Objective[]).reduce((s, o) => s + w[o], 0);
    expect(sum).toBeCloseTo(1, 3);
  });

  it("geçmişten öğrenince MAE başlangıç ağırlıklarından düşük olur", () => {
    const learned = learnWeights(INITIAL_WEIGHTS, HISTORY).weights;
    expect(meanAbsError(learned, HISTORY)).toBeLessThanOrEqual(meanAbsError(INITIAL_WEIGHTS, HISTORY));
  });
});

describe("mentorMatch", () => {
  it("öğrenciyi (düşük yetkinlik) aynı alanda usta biriyle eşleştirir", () => {
    const load = predictLoad(HISTORY, { weekday: TODAY.weekday, payweek: TODAY.payweek });
    const bl = loadByBlock(load, BLOCKS);
    const pairs = mentorMatch(ROSTER, BLOCKS, bl, CHEMISTRY);
    expect(pairs.length).toBeGreaterThan(0);
    for (const p of pairs) {
      expect(p.learner.comp[p.zone]).toBeLessThanOrEqual(1);
      expect(p.mentor.comp[p.zone]).toBeGreaterThanOrEqual(3);
      expect(p.block.id).toBeDefined();
    }
  });
});

describe("rankForZone", () => {
  it("kabin sıralamasında en yüksek yetkinlikli + sinerjili öne çıkar", () => {
    const ranked = rankForZone(ROSTER, "KABIN", CHEMISTRY);
    expect(ranked[0].score).toBeGreaterThanOrEqual(ranked[ranked.length - 1].score);
    expect(ranked[0].person.comp.KABIN).toBeGreaterThanOrEqual(2);
  });
});
