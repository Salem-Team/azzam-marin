/**
 * Supplier module viewport + RTL/LTR smoke QA via Playwright.
 * Run against a live server: npm run start -- -p 3456
 *
 * Usage: node scripts/supplier-viewport-qa.mjs
 */

import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const require = createRequire(import.meta.url);
/** Prefer local install; fall back to shared Playwright used for project QA. */
let chromium;
try {
  ({ chromium } = require("playwright"));
} catch {
  ({ chromium } = require("/tmp/am-pw/node_modules/playwright"));
}

const BASE = process.env.AM_BASE_URL ?? "http://127.0.0.1:3456";
const OUT = process.env.AM_QA_OUT ??
  join(
    process.env.HOME ?? ".",
    ".cursor/projects/Users-salem-Desktop-projects-azzam-marin/assets/supplier-qa",
  );

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

function setPrefs(page, locale) {
  return page.addInitScript((loc) => {
    const p = {
      version: 1,
      locale: loc,
      theme: "light",
      sidebarCollapsed: false,
      expandedGroups: ["purchasing"],
    };
    localStorage.setItem(
      "azzam-marine:preferences:v1",
      JSON.stringify(p),
    );
    document.cookie =
      "azzam-marine-preferences=" +
      encodeURIComponent(JSON.stringify(p)) +
      "; Path=/; Max-Age=31536000; SameSite=Lax";
  }, locale);
}

async function measureOverflow(page) {
  return page.evaluate(() => {
    const doc = document.documentElement;
    const body = document.body;
    const scrollWidth = Math.max(doc.scrollWidth, body.scrollWidth);
    const clientWidth = doc.clientWidth;
    return {
      overflowX: scrollWidth > clientWidth + 2,
      scrollWidth,
      clientWidth,
      dir: doc.getAttribute("dir") || body.getAttribute("dir") || "",
      lang: doc.getAttribute("lang") || "",
    };
  });
}

async function runLocale(browser, locale) {
  const results = [];
  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      locale: locale === "ar" ? "ar-EG" : "en-US",
    });
    const page = await context.newPage();
    await setPrefs(page, locale);
    const pageErrors = [];
    page.on("pageerror", (e) => pageErrors.push(String(e)));

    const entry = {
      locale,
      viewport: vp.name,
      routes: {},
      pageErrors,
    };

    for (const path of [
      "/suppliers",
      "/suppliers/sup-alexandria",
      "/suppliers/sup-alexandria?tab=statement",
      "/suppliers/sup-alexandria?tab=documents",
    ]) {
      const res = await page.goto(`${BASE}${path}`, {
        waitUntil: "networkidle",
        timeout: 60_000,
      });
      await page.waitForTimeout(250);
      const overflow = await measureOverflow(page);
      const status = res?.status() ?? 0;
      entry.routes[path] = {
        status,
        ...overflow,
        hasDialog: (await page.locator('[role="dialog"]').count()) > 0,
      };

      const shotName = `${locale}-${vp.name}-${path
        .replace(/[/?=&]/g, "_")
        .replace(/^_/, "")}.png`;
      await page.screenshot({
        path: join(OUT, shotName),
        fullPage: false,
      });
    }

    // Open create wizard on directory (desktop-ish)
    if (vp.width >= 768) {
      await page.goto(`${BASE}/suppliers`, {
        waitUntil: "networkidle",
        timeout: 60_000,
      });
      const addLabel = locale === "ar" ? "إضافة مورد" : "Add";
      const addBtn = page.getByRole("button", { name: new RegExp(addLabel, "i") });
      if ((await addBtn.count()) > 0) {
        await addBtn.first().click();
        await page.waitForTimeout(300);
        const dialog = page.locator('[role="dialog"]');
        entry.wizardOpen = (await dialog.count()) > 0;
        entry.wizardOverflow = await measureOverflow(page);
        await page.screenshot({
          path: join(OUT, `${locale}-${vp.name}-wizard.png`),
          fullPage: false,
        });
        await page.keyboard.press("Escape");
      }
    }

    results.push(entry);
    await context.close();
  }
  return results;
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  try {
    const ar = await runLocale(browser, "ar");
    const en = await runLocale(browser, "en");
    const all = [...ar, ...en];
    const overflowFails = all.flatMap((r) =>
      Object.entries(r.routes)
        .filter(([, v]) => v.overflowX)
        .map(([path]) => `${r.locale}/${r.viewport}${path}`),
    );
    const statusFails = all.flatMap((r) =>
      Object.entries(r.routes)
        .filter(([, v]) => v.status >= 400 || v.status === 0)
        .map(([path, v]) => `${r.locale}/${r.viewport}${path}→${v.status}`),
    );
    const dirFails = all.filter((r) => {
      const sample = Object.values(r.routes)[0];
      if (!sample) return false;
      return r.locale === "ar" ? sample.dir !== "rtl" : sample.dir !== "ltr";
    });

    const summary = {
      base: BASE,
      out: OUT,
      overflowFails,
      statusFails,
      dirFails: dirFails.map((r) => `${r.locale}/${r.viewport}`),
      samples: all.slice(0, 2),
      totalChecks: all.length * 4,
    };
    console.log(JSON.stringify(summary, null, 2));
    if (overflowFails.length || statusFails.length || dirFails.length) {
      process.exitCode = 2;
    }
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
