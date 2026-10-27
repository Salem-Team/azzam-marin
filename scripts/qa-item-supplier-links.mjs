/**
 * Items ↔ Suppliers relationship browser audit (Playwright).
 * Usage: node scripts/qa-item-supplier-links.mjs
 * Requires: app at QA_BASE_URL (default http://127.0.0.1:3456)
 */
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { chromium } from "playwright";

const BASE = process.env.QA_BASE_URL ?? "http://127.0.0.1:3456";
const OUT = join(process.cwd(), "docs/qa/item-supplier-links");
const results = [];

function record(name, ok, detail = "") {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
}

function prefsPayload(locale) {
  return {
    version: 1,
    locale,
    theme: "light",
    sidebarCollapsed: false,
    expandedGroups: ["products-inventory", "purchasing"],
  };
}

/** Context cookies so SSR locale matches localStorage (init-script cookie is post-HTML). */
async function setPrefs(context, page, locale = "en", { wipeOnce = false } = {}) {
  const prefs = prefsPayload(locale);
  await context.addCookies([
    {
      name: "azzam-marine-preferences",
      value: encodeURIComponent(JSON.stringify(prefs)),
      url: BASE,
    },
  ]);
  await page.addInitScript(
    ({ wipeOnce: doWipe, prefsJson }) => {
      if (doWipe && !sessionStorage.getItem("am-isl-qa-wiped")) {
        localStorage.clear();
        sessionStorage.setItem("am-isl-qa-wiped", "1");
      }
      localStorage.setItem("azzam-marine:preferences:v1", prefsJson);
      document.cookie = `azzam-marine-preferences=${encodeURIComponent(prefsJson)}; Path=/; Max-Age=31536000; SameSite=Lax`;
    },
    { wipeOnce, prefsJson: JSON.stringify(prefs) },
  );
}

async function run() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: "en-GB",
  });
  const page = await context.newPage();

  try {
    await setPrefs(context, page, "en", { wipeOnce: true });
    await page.goto(`${BASE}/items/ITM-0001?tab=suppliers`, {
      waitUntil: "networkidle",
      timeout: 60_000,
    });
    await page.waitForTimeout(800);

    const addBtn = page.getByRole("button", {
      name: /Link supplier|ربط مورد|Add supplier|إضافة مورد/i,
    });
    await addBtn.first().click();
    const dialog = page.getByRole("dialog");
    await dialog.waitFor({ state: "visible", timeout: 10_000 });

    const option = dialog.getByRole("option").first();
    await option.waitFor({ state: "visible", timeout: 10_000 });
    const optionText = (await option.innerText()).trim();
    await option.click();

    await dialog.locator('input[dir="ltr"]').first().fill("QA-SUP-SKU");
    await dialog.getByRole("button", { name: /Save link|حفظ الرابط/i }).click();
    await page.waitForTimeout(600);

    const linked = await page.getByText("QA-SUP-SKU").count();
    record("link supplier on item details", linked > 0, optionText.split("\n")[0]);

    await page.screenshot({
      path: join(OUT, "item-suppliers-tab.png"),
      fullPage: true,
    });

    // Navigate to first linked supplier via table link
    const supplierLink = page
      .locator('table a[href^="/suppliers/"]')
      .first();
    const href = await supplierLink.getAttribute("href");
    record("supplier href present", Boolean(href), href ?? "");
    await supplierLink.click();
    await page.waitForURL(/\/suppliers\//, { timeout: 15_000 });
    await page.waitForTimeout(500);

    const itemsTab = page.getByRole("tab", {
      name: /Related items|الأصناف المرتبطة/i,
    });
    await itemsTab.click();
    await page.waitForTimeout(500);
    const reverse = await page.getByText("QA-SUP-SKU").count();
    record("reverse related items shows link", reverse > 0);

    const itemCodeLink = page.locator('a[href^="/items/"]').first();
    const itemHref = await itemCodeLink.getAttribute("href");
    record("item href from supplier", Boolean(itemHref), itemHref ?? "");
    await itemCodeLink.click();
    await page.waitForURL(/\/items\//, { timeout: 15_000 });

    // Refresh persistence
    await page.goto(`${BASE}/items/ITM-0001?tab=suppliers`, {
      waitUntil: "networkidle",
    });
    await page.waitForTimeout(800);
    const afterRefresh = await page.getByText("QA-SUP-SKU").count();
    record("link persists after refresh", afterRefresh > 0);

    // Remove link
    await page
      .getByRole("button", { name: /Remove link|إزالة الرابط/i })
      .first()
      .click();
    const confirm = page.getByRole("dialog");
    await confirm.waitFor({ state: "visible" });
    await confirm
      .getByRole("button", { name: /Remove link|إزالة الرابط/i })
      .click();
    await page.waitForTimeout(500);
    const gone = (await page.getByText("QA-SUP-SKU").count()) === 0;
    record("remove link clears relationship", gone);

    // Supplier directory still loads (regression smoke)
    await page.goto(`${BASE}/suppliers`, { waitUntil: "networkidle" });
    await page.waitForTimeout(600);
    const dirTitle = await page.getByRole("heading").first().count();
    record("suppliers directory still loads", dirTitle > 0);

    // Arabic RTL smoke on item suppliers tab (fresh context so wipeOnce can apply)
    const arContext = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      locale: "ar-EG",
    });
    const arPage = await arContext.newPage();
    await setPrefs(arContext, arPage, "ar", { wipeOnce: true });
    await arPage.goto(`${BASE}/items/ITM-0001?tab=suppliers`, {
      waitUntil: "networkidle",
    });
    await arPage.waitForTimeout(800);
    const dir = await arPage.evaluate(() => document.documentElement.dir);
    record("arabic rtl on suppliers tab", dir === "rtl", `dir=${dir}`);
    await arPage.screenshot({
      path: join(OUT, "item-suppliers-ar.png"),
      fullPage: true,
    });
    await arContext.close();
  } catch (err) {
    record("browser suite error", false, String(err));
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
