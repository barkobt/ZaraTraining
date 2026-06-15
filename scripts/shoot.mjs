// Kullanım: node scripts/shoot.mjs <url> <out.png> [selector]
import puppeteer from "puppeteer-core";
const [url, out, sel] = process.argv.slice(2);
const exe = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const b = await puppeteer.launch({ executablePath: exe, headless: "new", args: ["--no-sandbox","--disable-gpu","--hide-scrollbars"], defaultViewport: { width: 1440, height: 900, deviceScaleFactor: 2 } });
const p = await b.newPage();
await p.goto(url, { waitUntil: "networkidle0", timeout: 30000 }).catch(()=>{});
await new Promise(r=>setTimeout(r,1200));
if (sel) {
  const el = await p.$(sel);
  if (el) { await el.scrollIntoView(); await new Promise(r=>setTimeout(r,1500)); await el.screenshot({ path: out }); }
  else { console.error("selector yok:", sel); await p.screenshot({ path: out }); }
} else {
  await p.screenshot({ path: out, fullPage: true });
}
await b.close();
console.log("ok", out);
