/**
 * Items page viewport QA screenshots (Playwright).
 * Usage: node scripts/qa-items-screenshots.mjs
 */
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { chromium } from "playwright";

const BASE = process.env.QA_BASE_URL ?? "http://127.0.0.1:3456";
const OUT = join(process.cwd(), "docs/qa/items");

const VIEWPORTS = [
  { name: "1920x1080", width: 1920, height: 1080 },
  { name: "1440x900", width: 1440, height: 900 },
  { name: "1280x800", width: 1280, height: 800 },
  { name: "1024x768", width: 1024, height: 768 },
  { name: "768x1024", width: 768, height: 1024 },
  { name: "430x932", width: 430, height: 932 },
  { name: "390x844", width: 390, height: 844 },
  { name: "360x800", width: 360, height: 800 },
];

async function setLocale(page, locale) {
  await page.addInitScript((loc) => {
    const prefs = {
      version: 1,
      locale: loc,
      theme: "light",
      sidebarCollapsed: false,
      expandedGroups: ["products-inventory"],
    };
    localStorage.setItem("azzam-marine:preferences:v1", JSON.stringify(prefs));
    localStorage.setItem("azzam-marine-erp.locale", loc);
    document.cookie = `azzam-marine-preferences=${encodeURIComponent(JSON.stringify(prefs))}; Path=/; Max-Age=31536000; SameSite=Lax`;
  }, locale);
}

async function measureOverflow(page) {
  return page.evaluate(() => {
    const doc = document.documentElement;
    return {
      scrollWidth: doc.scrollWidth,
      clientWidth: doc.clientWidth,
      overflowX: doc.scrollWidth > doc.clientWidth + 1,
    };
  });
}

async function run() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const report = [];

  for (const locale of ["ar", "en"]) {
    for (const vp of VIEWPORTS) {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        locale: locale === "ar" ? "ar-EG" : "en-GB",
      });
      const page = await context.newPage();
      await setLocale(page, locale);
      const url = `${BASE}/items`;
      await page.goto(url, { waitUntil: "networkidle", timeout: 60_000 });
      await page.waitForTimeout(400);

      // Open drawer on desktop-ish sizes
      if (vp.width >= 1024) {
        const addBtn = page.getByRole("button", {
          name: locale === "ar" ? /إضافة صنف/ : /Add new item/i,
        });
        if (await addBtn.count()) {
          await addBtn.first().click();
          await page.waitForTimeout(300);
        }
      }

      const overflow = await measureOverflow(page);
      const file = `items-${locale}-${vp.name}.png`;
      await page.screenshot({
        path: join(OUT, file),
        fullPage: true,
      });

      const title = await page.locator("h1").first().innerText().catch(() => "");
      report.push({
        locale,
        viewport: vp.name,
        title,
        overflowX: overflow.overflowX,
        scrollWidth: overflow.scrollWidth,
        clientWidth: overflow.clientWidth,
        screenshot: file,
        pass: !overflow.overflowX && Boolean(title),
      });
      await context.close();
    }
  }

  await browser.close();
  await writeFile(join(OUT, "report.json"), JSON.stringify(report, null, 2));
  const failed = report.filter((r) => !r.pass);
  console.log(`Wrote ${report.length} screenshots to ${OUT}`);
  console.log(`PASS ${report.length - failed.length} / ${report.length}`);
  if (failed.length) {
    console.log("FAILED:", failed);
    process.exitCode = 1;
  }
}

run().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
