/**
 * PDF parser — GERÇEK Orquest export'u ile uçtan uca test.
 * Fixture: 12 Haziran 2026 günü, yeni format (13 bağımsız section).
 * Okunabilir küme: BASIC + FR + TRF + WOMAN. Kasa/depo/runner/müdür dışarıda.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parseShiftsFromPdfDataWithReport, type ParsedShift } from "./pdf-parser";

const FIXTURE = join(__dirname, "__fixtures__", "orquest-2026-06-12.pdf");

async function parseFixture() {
  const buf = readFileSync(FIXTURE);
  return parseShiftsFromPdfDataWithReport(
    buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength),
  );
}

const byName = (shifts: ParsedShift[], needle: string) =>
  shifts.find((s) => s.name.toLowerCase().includes(needle.toLowerCase()));

describe("Orquest PDF (yeni çok-section format)", () => {
  it("dört okunabilir section'daki ÇALIŞAN herkesi okur (Free'ler hariç)", async () => {
    const { shifts } = await parseFixture();
    const names = shifts.map((s) => s.name).join(" | ");

    // BASIC — 11 çalışan
    for (const n of [
      "Ahmet Baran Bozkurt", "Edanur Sener", "Fadime Kivrak", "Gamze Kafadar",
      "Irem Bulut", "Meral Colak", "Merih Mustafa Baltaci", "Mustafa Bora Cakaloglu",
      "Sevilay Celik", "Yagmur Hashas",
    ]) {
      expect(byName(shifts, n), `BASIC eksik: ${n} — bulunanlar: ${names}`).toBeTruthy();
    }
    // FR — 9 çalışan
    for (const n of [
      "Azra Nur Yazici", "Beyza Agir", "Ecem Urcan", "Fatma Yavuz",
      "Feride Savucu", "Kaan Ovezoglu", "Nehir Budak", "Sevimnur Yalcin",
    ]) {
      expect(byName(shifts, n), `FR eksik: ${n}`).toBeTruthy();
    }
    // TRF — 2 çalışan (Eylul + Saliha)
    expect(byName(shifts, "Eylul Ozbek"), "TRF eksik: Eylul").toBeTruthy();
    expect(byName(shifts, "Saliha Kilic"), "TRF eksik: Saliha").toBeTruthy();
    // WOMAN — 2 çalışan (Ada + Selin)
    expect(byName(shifts, "Ada Ozasci"), "WOMAN eksik: Ada").toBeTruthy();
    expect(byName(shifts, "Selin Varlioglu"), "WOMAN eksik: Selin").toBeTruthy();
  });

  it("kapsam dışı section'lardan kimseyi SIZDIRMAZ", async () => {
    const { shifts } = await parseFixture();
    // 360 RUNNER / CABALLERO / DELIVERY / KASA / NIÑO / OPERASYON / SINT / MÜDÜR
    for (const n of [
      "Gorkem Heyik", "Haydar Asliyuce", // 360 RUNNER
      "Aleyna Aydin", "Hakan Bayram", // CABALLERO
      "Ahmet Tang", "Esma Nur Koruk", // DELIVERY
      "Ozan Sahin", "Ceylin Targal", // KASA
      "Tugce Aksoy", // MÜDUR
      "Dilanur Basci", "Pinar Beykoylu", // NIÑO
      "Eren Yagci", "Selman Geldi", "Semanur Topcu", // OPERASYON
      "Ahmet Zengin", // SINT
    ]) {
      expect(byName(shifts, n), `kapsam dışı sızıntı: ${n}`).toBeFalsy();
    }
  });

  it("Free / boş satırlar shift üretmez", async () => {
    const { shifts } = await parseFixture();
    for (const n of ["Ceren Boluk", "Kayra Uzun", "Taha Isler", "Emirhan Yesilcicek", "Pelin Aydin", "Begum Akar"]) {
      expect(byName(shifts, n), `Free kişi shift almış: ${n}`).toBeFalsy();
    }
  });

  it("çift molaları İKİ ayrı aralık olarak okur (yarım saatler float)", async () => {
    const { shifts } = await parseFixture();
    const baran = byName(shifts, "Ahmet Baran Bozkurt")!;
    expect(baran.startHour).toBe(12);
    expect(baran.endHour).toBe(22.5);
    expect(baran.breaks).toEqual([[15, 15.5], [19, 19.5]]);

    const fadime = byName(shifts, "Fadime Kivrak")!;
    expect(fadime.breaks).toEqual([[16, 16.5], [20, 20.5]]);

    const sevilay = byName(shifts, "Sevilay Celik")!;
    expect(sevilay.startHour).toBe(7);
    expect(sevilay.breaks).toEqual([[10, 10.5], [14, 14.5]]);
  });

  it("yarım saat başlayan vardiyaları ve tam-saat molaları doğru okur", async () => {
    const { shifts } = await parseFixture();
    const merih = byName(shifts, "Merih Mustafa Baltaci")!; // 16:30-22:30
    expect(merih.startHour).toBe(16.5);
    expect(merih.endHour).toBe(22.5);
    expect(merih.breaks).toEqual([[18, 19]]);

    const irem = byName(shifts, "Irem Bulut")!; // 14:00-22:30, mola 17:00-18:00
    expect(irem.breaks).toEqual([[17, 18]]);
  });

  it("isim içinde MAN/KID geçen kişileri reddetmez (tam-token eşleşme)", async () => {
    // Doğrudan birim seviye: bu adlar artık geçerli isim sayılmalı
    const { parseShiftsFromText } = await import("./pdf-parser");
    const shifts = parseShiftsFromText("BASIC\nSelman Deneme 10:00-19:00 13:00-14:00\nSemanur Test 09:00-17:00 12:00-13:00");
    expect(shifts.map((s) => s.name)).toEqual(["Selman Deneme", "Semanur Test"]);
  });

  it("B/MOLA keyword shift'in ARDINDAN gelince tüm vardiyayı mola yapmaz", async () => {
    // Regresyon: "10:00-19:00 B 13:00" satırında B, shift aralığının hemen
    // ardından → Parser 2 shift'i (10-19) mola sanıp tüm vardiyayı yutuyordu.
    const { parseShiftsFromText } = await import("./pdf-parser");
    const breaksOf = (t: string) => parseShiftsFromText("BASIC\n" + t)[0]?.breaks;
    expect(breaksOf("Ada Ozasci 10:00-19:00 B 13:00")).toEqual([[13, 14]]);
    expect(breaksOf("Ada Ozasci 10:00-19:00 MOLA 13:00")).toEqual([[13, 14]]);
    expect(breaksOf("Ada Ozasci 10:00-19:00 13:00 B")).toEqual([[13, 14]]);
    expect(breaksOf("Ada Ozasci 10:00-19:00")).toEqual([]);
  });
});
