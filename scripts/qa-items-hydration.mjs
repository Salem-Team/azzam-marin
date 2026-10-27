/**
 * Items hydration / React #418 regression audit (Playwright).
 * Usage: node scripts/qa-items-hydration.mjs
 * Requires: app at QA_BASE_URL (default http://127.0.0.1:3456)
 *
 * Intentionally includes the historical mismatch case: Arabic localStorage
 * without a request cookie (SSR defaults to English).
 */
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { chromium } from "playwright";

const BASE = process.env.QA_BASE_URL ?? "http://127.0.0.1:3456";
const OUT = join(process.cwd(), "docs/qa/items-hydration");
const results = [];

function record(name, ok, detail = "") {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
}

function isHydrationNoise(text) {
  return (
    /Minified React error #418/.test(text) ||
    /Hydration failed/.test(text) ||
    /Text content does not match/.test(text) ||
    /did not match\. Server:/.test(text) ||
    /A tree hydrated but some attributes/.test(text)
  );
}

function attachConsole(page, bucket) {
  page.on("console", (msg) => {
    const type = msg.type();
    const text = msg.text();
    if (type === "error" || type === "warning") {
      bucket.push({ type, text });
    }
  });
  page.on("pageerror", (e) => {
    bucket.push({ type: "pageerror", text: String(e) });
  });
}

async function runScenario(browser, name, { cookieLocale = null, arStorageOnly = false, path = "/items", mutate = null } = {}) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: arStorageOnly || cookieLocale === "ar" ? "ar-EG" : "en-GB",
  });
  const logs = [];

  if (cookieLocale) {
    const prefs = {
      version: 1,
      locale: cookieLocale,
      theme: "light",
      sidebarCollapsed: false,
      expandedGroups: ["products-inventory"],
    };
    await context.addCookies([
      {
        name: "azzam-marine-preferences",
        value: encodeURIComponent(JSON.stringify(prefs)),
        url: BASE,
      },
    ]);
  }

  const page = await context.newPage();
  attachConsole(page, logs);

  // Init script runs before app JS; cookie on the HTTP request is separate.
  // arStorageOnly: Arabic in localStorage, no request cookie → historical #418 case.
  await page.addInitScript(
    ({ loc, wipe }) => {
      if (wipe) localStorage.clear();
      const prefs = {
        version: 1,
        locale: loc,
        theme: "light",
        sidebarCollapsed: false,
        expandedGroups: ["products-inventory"],
      };
      localStorage.setItem(
        "azzam-marine:preferences:v1",
        JSON.stringify(prefs),
      );
    },
    {
      loc: arStorageOnly ? "ar" : (cookieLocale ?? "en"),
      wipe: arStorageOnly,
    },
  );

  await page.goto(`${BASE}${path}`, { waitUntil: "networkidle", timeout: 60_000 });
  await page.waitForTimeout(800);

  if (typeof mutate === "function") {
    await mutate(page);
    await page.waitForTimeout(600);
  }

  const hydration = logs.filter((l) => isHydrationNoise(l.text));
  const ok = hydration.length === 0;
  record(
    name,
    ok,
    ok
      ? `console=${logs.length}`
      : hydration
          .slice(0, 3)
          .map((h) => h.text.slice(0, 160))
          .join(" | "),
  );

  await context.close();
  return { ok, hydration, logs };
}

async function run() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });

  try {
    // Historical failure mode for React #418
    await runScenario(browser, "cold /items AR storage, no request cookie", {
      arStorageOnly: true,
      path: "/items",
    });

    await runScenario(browser, "cold /items EN cookie+storage", {
      cookieLocale: "en",
      path: "/items",
    });

    await runScenario(browser, "cold /items AR cookie+storage", {
      cookieLocale: "ar",
      path: "/items",
    });

    await runScenario(browser, "cold item details with image", {
      cookieLocale: "en",
      path: "/items/ITM-0001",
    });

    await runScenario(browser, "create → details → directory nav", {
      cookieLocale: "en",
      path: "/items",
      mutate: async (page) => {
        await page.getByRole("button", { name: /Add new item|إضافة صنف/i }).first().click();
        const dialog = page.getByRole("dialog");
        await dialog.waitFor({ state: "visible", timeout: 15_000 });
        const ar = dialog.locator('input[dir="rtl"]').first();
        const en = dialog.locator('input[dir="ltr"]:not([readonly])').first();
        if (await ar.count()) await ar.fill("اختبار ترطيب");
        if (await en.count()) await en.fill(`Hydration QA ${Date.now()}`);
        for (let i = 0; i < 4; i++) {
          const next = dialog.getByRole("button", { name: /Continue|متابعة/i });
          if (await next.count()) {
            await next.click();
            await page.waitForTimeout(150);
          }
        }
        await dialog.getByRole("button", { name: /Save item|حفظ الصنف/i }).click();
        await page.waitForTimeout(700);
        if (/\/items\/ITM-/.test(page.url())) {
          await page.goto(`${BASE}/items`, { waitUntil: "networkidle" });
        }
      },
    });

    await runScenario(browser, "directory ↔ details ×5", {
      cookieLocale: "en",
      path: "/items",
      mutate: async (page) => {
        for (let i = 0; i < 5; i++) {
          await page.goto(`${BASE}/items/ITM-0001`, { waitUntil: "networkidle" });
          await page.waitForTimeout(200);
          await page.goto(`${BASE}/items`, { waitUntil: "networkidle" });
          await page.waitForTimeout(200);
        }
      },
    });

    await runScenario(browser, "item ↔ supplier details nav", {
      cookieLocale: "en",
      path: "/items/ITM-0001?tab=suppliers",
      mutate: async (page) => {
        const link = page.locator('a[href^="/suppliers/"]').first();
        if (await link.count()) {
          await link.click();
          await page.waitForTimeout(500);
          await page.goto(`${BASE}/items/ITM-0001?tab=suppliers`, {
            waitUntil: "networkidle",
          });
        }
      },
    });

    await runScenario(browser, "refresh after directory load", {
      cookieLocale: "ar",
      path: "/items",
      mutate: async (page) => {
        await page.reload({ waitUntil: "networkidle" });
        await page.waitForTimeout(500);
        await page.reload({ waitUntil: "networkidle" });
      },
    });

    // Closure matrix: edit → directory, cancel edit, deactivate → directory
    await runScenario(browser, "edit → save → directory", {
      cookieLocale: "en",
      path: "/items/ITM-0001",
      mutate: async (page) => {
        const edit = page.getByRole("button", { name: /Edit|تعديل/i }).first();
        if (!(await edit.count())) return;
        await edit.click();
        const dialog = page.getByRole("dialog");
        await dialog.waitFor({ state: "visible", timeout: 15_000 });
        const en = dialog.locator('input[dir="ltr"]:not([readonly])').first();
        if (await en.count()) {
          const cur = await en.inputValue();
          await en.fill(`${cur}`.slice(0, 40));
        }
        for (let i = 0; i < 4; i++) {
          const next = dialog.getByRole("button", { name: /Continue|متابعة/i });
          if (await next.count()) {
            await next.click();
            await page.waitForTimeout(120);
          }
        }
        const save = dialog.getByRole("button", { name: /Save item|حفظ الصنف/i });
        if (await save.count()) await save.click();
        await page.waitForTimeout(500);
        await page.goto(`${BASE}/items`, { waitUntil: "networkidle" });
      },
    });

    await runScenario(browser, "cancel edit → stay on details", {
      cookieLocale: "en",
      path: "/items/ITM-0002",
      mutate: async (page) => {
        const edit = page.getByRole("button", { name: /Edit|تعديل/i }).first();
        if (!(await edit.count())) return;
        await edit.click();
        const dialog = page.getByRole("dialog");
        await dialog.waitFor({ state: "visible", timeout: 15_000 });
        const cancel = dialog.getByRole("button", { name: /Cancel|إلغاء/i }).first();
        if (await cancel.count()) await cancel.click();
        await page.waitForTimeout(300);
        // Confirm discard if prompted
        const discard = page.getByRole("button", {
          name: /Discard|تجاهل|Leave|مغادرة/i,
        });
        if (await discard.count()) await discard.first().click();
        await page.waitForTimeout(300);
      },
    });

    await runScenario(browser, "deactivate → directory", {
      cookieLocale: "en",
      path: "/items/ITM-0003",
      mutate: async (page) => {
        const deact = page.getByRole("button", {
          name: /Deactivate|إلغاء التنشيط/i,
        });
        if (await deact.count()) {
          await deact.first().click();
          await page.waitForTimeout(200);
          const confirm = page
            .getByRole("dialog")
            .getByRole("button", { name: /^Deactivate$|^إلغاء التنشيط$/i });
          if (await confirm.count()) await confirm.click();
          await page.waitForTimeout(400);
        }
        await page.goto(`${BASE}/items`, { waitUntil: "networkidle" });
        // Reactivate later items don't depend on ITM-0003 active for hydration
      },
    });

    await runScenario(browser, "attachments image controls + refresh", {
      cookieLocale: "en",
      path: "/items/ITM-0001?tab=attachments",
      mutate: async (page) => {
        await page.waitForTimeout(400);
        // Presence of image actions is enough; avoid destructive wipe of seed art
        const actions = page.getByRole("button", {
          name: /Replace|Remove|Choose|استبدال|إزالة|اختيار|إضافة صورة/i,
        });
        record(
          "attachments controls visible (nested check)",
          (await actions.count()) > 0,
          `count=${await actions.count()}`,
        );
        await page.reload({ waitUntil: "networkidle" });
        await page.waitForTimeout(400);
      },
    });
  } catch (err) {
    record("hydration suite error", false, String(err));
  } finally {
    const passed = results.filter((r) => r.ok).length;
    const failed = results.filter((r) => !r.ok).length;
    await writeFile(
      join(OUT, "report.json"),
      JSON.stringify({ base: BASE, passed, failed, results }, null, 2),
    );
    console.log(`\n${passed} passed, ${failed} failed → ${OUT}/report.json`);
    await browser.close();
    if (failed) process.exitCode = 1;
  }
}

run();
