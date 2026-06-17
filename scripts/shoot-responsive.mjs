// Çok-genişlikli ekran görüntüsü — responsive-auditor agent'ı kullanır.
// Kullanım: node scripts/shoot-responsive.mjs <url> <out-prefix> [w1,w2,...]
//   node scripts/shoot-responsive.mjs http://localhost:3000/pusula .screenshots/pusula 1440,768,390
// Çıktı: <out-prefix>-<width>.png (fullPage). .screenshots/ otomatik oluşur.
import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import puppeteer from "puppeteer-core";

const exe =
  process.env.CHROME_PATH ||
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const url = process.argv[2] || "http://localhost:3000/";
const outPrefix = process.argv[3] || ".screenshots/shot";
const widths = (process.argv[4] || "1440,768,390").split(",").map((n) => parseInt(n, 10));

await mkdir(dirname(outPrefix) || ".", { recursive: true });
const b = await puppeteer.launch({
  executablePath: exe,
  headless: "new",
  args: ["--no-sandbox", "--disable-gpu", "--hide-scrollbars"],
});
try {
  for (const w of widths) {
    const p = await b.newPage();
    await p.setViewport({ width: w, height: Math.round(w * 0.72), deviceScaleFactor: 1 });
    await p.goto(url, { waitUntil: "networkidle0", timeout: 30000 }).catch(() => {});
    await new Promise((r) => setTimeout(r, 1000));
    const out = `${outPrefix}-${w}.png`;
    await p.screenshot({ path: out, fullPage: true });
    console.log("ok", out);
    await p.close();
  }
} finally {
  await b.close();
}
