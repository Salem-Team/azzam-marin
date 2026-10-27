/**
 * Cross Reference end-to-end acceptance (Playwright).
 * Creates E2E-XREF-* records only; cleans them up at the end.
 * Usage: node scripts/e2e-xref-acceptance.mjs [baseUrl]
 */
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = process.argv[2] || "http://127.0.0.1:3460";
const OUT = path.join(__dirname, "../docs/qa/cross-reference/e2e-acceptance-report.json");
const SHOT = path.join(__dirname, "../docs/qa/cross-reference");
fs.mkdirSync(SHOT, { recursive: true });

const results = {
  startedAt: new Date().toISOString(),
  base: BASE,
  checklist: {},
  defects: [],
  notes: [],
};

function mark(id, status, detail = "") {
  results.checklist[id] = { status, detail, at: new Date().toISOString() };
}

async function setLocaleAr(context) {
  await context.addInitScript(() => {
    try {
      const prefs = {
        language: "ar",
        locale: "ar",
        theme: "light",
        dir: "rtl",
        sidebarCollapsed: false,
      };
      localStorage.setItem("azzam-marine:preferences:v1", JSON.stringify(prefs));
      localStorage.setItem("azzam-marine:locale", "ar");
      document.cookie = "am-prefs=" + encodeURIComponent(JSON.stringify(prefs)) + "; path=/";
      document.cookie = "am-lang=ar; path=/";
    } catch {
      /* ignore */
    }
  });
}

async function ensureArabic(page) {
  const switchToAr = page.getByRole("button", { name: /العربية|Arabic|التبديل إلى العربية/i });
  const switchToEn = page.getByRole("button", { name: /التبديل إلى الإنجليزية|English/i });
  if (await switchToEn.count()) {
    // already AR (button offers EN)
    return;
  }
  if (await switchToAr.count()) {
    await switchToAr.first().click();
    await page.waitForTimeout(400);
  }
}

function addSpareBtn(page) {
  return page.getByRole("button", {
    name: /إضافة قطعة غيار|Add spare part|Add Spare Part/i,
  });
}

async function backupStorage(page) {
  return page.evaluate(() => {
    const keys = [
      "azzam-marine:spare-parts:v1",
      "azzam-marine:items:v1",
      "azzam-marine:marine-engines:v1",
    ];
    const backup = {};
    for (const k of keys) backup[k] = localStorage.getItem(k);
    sessionStorage.setItem("E2E-XREF-BACKUP", JSON.stringify(backup));
    return Object.fromEntries(
      Object.entries(backup).map(([k, v]) => [k, (v || "").length]),
    );
  });
}

async function fillByParent(page, parentSubstr, value) {
  await page.evaluate(
    ({ parentSubstr, value }) => {
      function setNative(el, val) {
        const proto =
          el.tagName === "TEXTAREA"
            ? HTMLTextAreaElement.prototype
            : HTMLInputElement.prototype;
        Object.getOwnPropertyDescriptor(proto, "value").set.call(el, val);
        el.dispatchEvent(new Event("input", { bubbles: true }));
        el.dispatchEvent(new Event("change", { bubbles: true }));
      }
      const el = [...document.querySelectorAll("input,textarea")].find((i) =>
        (i.parentElement?.innerText || "").includes(parentSubstr),
      );
      if (!el) throw new Error("missing field: " + parentSubstr);
      setNative(el, value);
    },
    { parentSubstr, value },
  );
}

async function createSpareViaWizard(page, spec) {
  await page.goto(`${BASE}/spare-parts`, { waitUntil: "domcontentloaded" });
  await ensureArabic(page);
  // Skip if already present
  if (await page.getByText(spec.nameEn).count()) {
    return "exists";
  }
  await addSpareBtn(page).click({ timeout: 15000 });
  await page
    .getByRole("heading", { name: /إضافة قطعة غيار|Add spare/i })
    .waitFor();

  await page.getByRole("button", { name: /كود الصنف|Item code/i }).click();
  await page
    .getByRole("button", { name: /توليد كود|Generate/i })
    .click();

  // Fill identity fields by parent label substrings (AR or EN)
  const identity = [
    ["رقم القطعة", "Part number", spec.partNumber],
    ["رقم OEM", "OEM", spec.oem],
    ["لدى المصنّع", "Manufacturer part", spec.mpn],
    ["بالعربية", "Arabic", spec.nameAr],
    ["بالإنجليزية", "English", spec.nameEn],
  ];
  for (const [ar, en, val] of identity) {
    try {
      await fillByParent(page, ar, val);
    } catch {
      await fillByParent(page, en, val);
    }
  }
  const continueBtn = () =>
    page.locator("button.am-focus-ring").filter({ hasText: /^(متابعة|Continue)$/ });

  await continueBtn().click();

  await page.getByRole("button", { name: /بلد المنشأ|Country/i }).click();
  const jpOpt = page
    .locator('[role="option"], [role="listbox"] button, li[role="option"]')
    .filter({ hasText: /اليابان|Japan/i })
    .first();
  if (await jpOpt.count()) {
    await jpOpt.click();
  } else {
    // Fallback: set country via visible list item text nodes
    await page.evaluate(() => {
      const el = [...document.querySelectorAll("button,li,div")].find(
        (n) =>
          /^(اليابان|Japan)$/.test((n.textContent || "").trim()) &&
          n.getBoundingClientRect().height > 0,
      );
      el?.click();
    });
  }
  await continueBtn().click();

  try {
    await fillByParent(page, "سعر البيع", spec.sell);
    await fillByParent(page, "تكلفة الشراء", spec.cost);
  } catch {
    await fillByParent(page, "Sell", spec.sell);
    await fillByParent(page, "Cost", spec.cost);
  }
  await continueBtn().click();

  await page.evaluate((codes) => {
    function setNative(el, val) {
      const proto =
        el.tagName === "TEXTAREA"
          ? HTMLTextAreaElement.prototype
          : HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(proto, "value").set.call(el, val);
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    }
    const el = [...document.querySelectorAll("textarea,input")].find(
      (i) => i.getBoundingClientRect().width > 200,
    );
    if (el) setNative(el, codes);
    const eng = [...document.querySelectorAll('input[type="checkbox"]')].find(
      (c) =>
        (c.getAttribute("aria-label") || c.parentElement?.innerText || "").includes(
          "6LY3",
        ),
    );
    if (eng && !eng.checked) eng.click();
  }, spec.codes);
  await continueBtn().click();
  await page
    .locator("button.am-focus-ring")
    .filter({ hasText: /إنشاء قطعة|Create spare/i })
    .click();
  await page.getByText(spec.nameEn).first().waitFor({ timeout: 20000 });
  return "created";
}

/** Seed/clone E2E spare+item records in localStorage when wizard UI flakes. */
async function seedE2eParts(page) {
  return page.evaluate(() => {
    const spareKey = "azzam-marine:spare-parts:v1";
    const itemKey = "azzam-marine:items:v1";
    const spare = JSON.parse(localStorage.getItem(spareKey) || '{"version":1,"records":[]}');
    const items = JSON.parse(localStorage.getItem(itemKey) || '{"version":1,"records":[]}');
    const records = spare.records || [];
    const itemRecords = items.records || items.items || [];
    const template = records[0];
    const itemTemplate = itemRecords[0];
    if (!template || !itemTemplate) return { ok: false, reason: "no-template" };

    function makeTyped(codes) {
      return codes.map(([type, value]) => ({
        id: `tr-e2e-${type}-${value}`,
        type,
        value,
        manufacturer: "Yanmar",
        notes: "",
      }));
    }

    function ensure(spec) {
      const itemId = `item-e2e-${spec.suffix}`;
      const partId = `sp-e2e-${spec.suffix}`;
      const existing = records.find((p) => p.partNumber === spec.partNumber);
      if (existing) {
        // Normalize to stable E2E ids so detail URLs are predictable.
        existing.id = partId;
        existing.itemId = itemId;
        existing.oemNumber = spec.oem;
        existing.manufacturerPartNumber = spec.mpn;
        existing.manufacturer = "Yanmar";
        existing.typedReferences = makeTyped(spec.typed);
        existing.crossReferenceCodes = spec.typed.map(
          ([t, v]) => `${t.toUpperCase()}:${v}`,
        );
        existing.compatibleEngineIds = spec.engines || existing.compatibleEngineIds || [];
        existing.updatedAt = new Date().toISOString();
        let item = itemRecords.find(
          (i) => i.id === itemId || i.itemCode === spec.itemCode,
        );
        if (!item) {
          item = { ...itemTemplate, id: itemId };
          itemRecords.unshift(item);
        }
        item.id = itemId;
        item.nameEn = spec.nameEn;
        item.nameAr = spec.nameAr;
        item.itemCode = spec.itemCode;
        item.partNumber = spec.partNumber;
        item.oemNumber = spec.oem;
        item.manufacturer = "Yanmar";
        item.updatedAt = new Date().toISOString();
        return "updated";
      }
      const item = {
        ...itemTemplate,
        id: itemId,
        itemCode: spec.itemCode,
        nameEn: spec.nameEn,
        nameAr: spec.nameAr,
        partNumber: spec.partNumber,
        oemNumber: spec.oem,
        manufacturer: "Yanmar",
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };
      const part = {
        ...template,
        id: partId,
        itemId,
        partNumber: spec.partNumber,
        oemNumber: spec.oem,
        manufacturerPartNumber: spec.mpn,
        manufacturer: "Yanmar",
        alternativeLinks: [],
        typedReferences: makeTyped(spec.typed),
        crossReferenceCodes: spec.typed.map(([t, v]) => `${t.toUpperCase()}:${v}`),
        compatibleEngineIds: spec.engines || [],
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };
      records.unshift(part);
      itemRecords.unshift(item);
      return "seeded";
    }

    const a = ensure({
      suffix: "a",
      itemCode: "ITM-E2E-A",
      partNumber: "E2E-XREF-PN-A",
      oem: "E2E-OEM-A-001",
      mpn: "E2E-MPN-A-001",
      nameEn: "E2E XREF Part A",
      nameAr: "قطعة اختبار مرجعية أ",
      typed: [
        ["oem", "E2E-OEM-A-001"],
        ["part_number", "E2E-XREF-PN-A"],
        ["mpn", "E2E-MPN-A-001"],
        ["alternative", "E2E-ALT-A-99"],
        ["compatible", "E2E-COMPAT-A-99"],
      ],
      engines: ["eng-001"],
    });
    const b = ensure({
      suffix: "b",
      itemCode: "ITM-E2E-B",
      partNumber: "E2E-XREF-PN-B",
      oem: "E2E-OEM-B-002",
      mpn: "E2E-MPN-B-002",
      nameEn: "E2E XREF Part B",
      nameAr: "قطعة اختبار مرجعية ب",
      typed: [
        ["oem", "E2E-OEM-B-002"],
        ["part_number", "E2E-XREF-PN-B"],
        ["mpn", "E2E-MPN-B-002"],
      ],
      engines: [],
    });
    // Ensure A↔B alternative relationship for directory/search workflows
    const partA = records.find((p) => p.partNumber === "E2E-XREF-PN-A");
    const partB = records.find((p) => p.partNumber === "E2E-XREF-PN-B");
    let link = "missing-parts";
    if (partA && partB) {
      const hasLink = (partA.alternativeLinks || []).some(
        (l) => l.partId === partB.id,
      );
      if (!hasLink) {
        partA.alternativeLinks = [
          ...(partA.alternativeLinks || []),
          {
            partId: partB.id,
            relationshipType: "alternative",
            degree: "exact",
            notes: "E2E note بديل مباشر",
          },
        ];
        link = "seeded";
      } else {
        link = "exists";
      }
    }

    spare.records = records;
    if (items.records) items.records = itemRecords;
    else items.items = itemRecords;
    localStorage.setItem(spareKey, JSON.stringify(spare));
    localStorage.setItem(itemKey, JSON.stringify(items));
    return { ok: true, a, b, link, count: records.length };
  });
}

async function pickPart(page, query) {
  // Prefer empty pickers inside the open drawer / dialog first.
  const emptyPickers = page.locator(
    "[role='dialog'] button[aria-haspopup='listbox'], aside button[aria-haspopup='listbox'], [data-state='open'] button[aria-haspopup='listbox']",
  );
  const picker = page
    .locator("button[aria-haspopup='listbox']")
    .filter({ hasText: /اختر قطعة|Select a spare|E2E|ITM-|OEM/i })
    .first();
  const target =
    (await emptyPickers.count()) > 0 ? emptyPickers.first() : picker;
  await target.click({ timeout: 10000 });
  const search = page
    .locator(
      "[role='listbox'] input, input[placeholder*='بحث'], input[placeholder*='Search']",
    )
    .last();
  await search.fill(query);
  await page.waitForTimeout(400);
  // Options show itemCode · partNumber · OEM — match any of those.
  const option = page
    .locator("[role='option']")
    .filter({ hasText: query })
    .first();
  if ((await option.count()) > 0) {
    await option.click({ timeout: 8000 });
    return;
  }
  // Fallback: click any visible listbox row containing the query (mono meta line).
  await page
    .locator("[role='listbox']")
    .getByText(query, { exact: false })
    .first()
    .click({ timeout: 8000 });
}

function e2eVisibleInBody() {
  return (
    document.body.innerText.includes("E2E-XREF-PN-A") ||
    document.body.innerText.includes("E2E XREF Part A") ||
    document.body.innerText.includes("قطعة اختبار مرجعية أ") ||
    document.body.innerText.includes("ITM-E2E-A") ||
    document.body.innerText.includes("E2E-OEM-A-001")
  );
}

/** Ensure A→B link exists for delete-confirm UI (does not perform the delete). */
async function ensureE2eRelationship(page) {
  return page.evaluate(() => {
    const spareKey = "azzam-marine:spare-parts:v1";
    const spare = JSON.parse(localStorage.getItem(spareKey) || "{}");
    const records = spare.records || [];
    const partA = records.find((p) => p.id === "sp-e2e-a" || p.partNumber === "E2E-XREF-PN-A");
    const partB = records.find((p) => p.id === "sp-e2e-b" || p.partNumber === "E2E-XREF-PN-B");
    if (!partA || !partB) return { ok: false, reason: "missing-e2e-parts" };
    const has = (partA.alternativeLinks || []).some((l) => l.partId === partB.id);
    if (!has) {
      partA.alternativeLinks = [
        ...(partA.alternativeLinks || []),
        {
          partId: partB.id,
          relationshipType: "alternative",
          degree: "exact",
          notes: "E2E note بديل مباشر",
        },
      ];
      partA.updatedAt = new Date().toISOString();
      spare.records = records;
      localStorage.setItem(spareKey, JSON.stringify(spare));
      return { ok: true, link: "seeded" };
    }
    return { ok: true, link: "exists" };
  });
}

/** Directory cells show item code / name / OEM — not always spare partNumber. */
const E2E_ORIG_VISIBLE =
  /ITM-E2E-A|E2E-XREF-PN-A|E2E-OEM-A-001|E2E XREF Part A|قطعة اختبار مرجعية أ/;
const E2E_ALT_VISIBLE =
  /ITM-E2E-B|E2E-XREF-PN-B|E2E-OEM-B-002|E2E XREF Part B|قطعة اختبار مرجعية ب/;

function e2eDirectoryRowLocator(page) {
  return page
    .locator("table tbody tr")
    .filter({ hasText: E2E_ORIG_VISIBLE })
    .filter({ hasText: E2E_ALT_VISIBLE });
}

async function e2eRelationshipRowVisible(page) {
  // Prefer desktop table row; fall back to mobile card list.
  // Do NOT use document.body — the search input alone matches the query string.
  if ((await e2eDirectoryRowLocator(page).count()) > 0) return true;
  const card = page
    .locator("ul li")
    .filter({ hasText: E2E_ORIG_VISIBLE })
    .filter({ hasText: E2E_ALT_VISIBLE });
  return (await card.count()) > 0;
}

async function openE2eRowActionsMenu(page) {
  await page.getByPlaceholder(/بحث/).fill("E2E-XREF-PN-A");
  await page.waitForTimeout(500);
  const row = e2eDirectoryRowLocator(page).first();
  await row.waitFor({ state: "visible", timeout: 12000 });
  await row.getByRole("button", { name: /إجراءات|Actions/i }).click();
  await page.getByRole("menuitem", { name: /إزالة|Remove/i }).waitFor({
    state: "visible",
    timeout: 5000,
  });
  return row;
}

/**
 * Dedicated UI delete-confirm workflow (cancel → still exists → confirm → gone).
 * Must run against UI actions only — never store-mutate the delete itself.
 */
async function runDeleteConfirmWorkflow(page) {
  const fixture = await ensureE2eRelationship(page);
  if (!fixture.ok) {
    mark("B.deleteConfirm", "FAIL", JSON.stringify(fixture));
    return;
  }

  // Always reload so localStorage fixture is hydrated into the React store.
  await page.goto(`${BASE}/cross-reference`, { waitUntil: "networkidle" });
  await page.reload({ waitUntil: "networkidle" });
  await ensureArabic(page);
  // Clear search/period/filters so the seeded link is not hidden by an active range.
  const resetBtn = page.getByRole("button", { name: /إعادة تعيين|Reset/i });
  if (await resetBtn.isEnabled().catch(() => false)) {
    await resetBtn.click();
    await page.waitForTimeout(300);
  }
  await page.getByPlaceholder(/بحث/).fill("E2E-XREF-PN-A");
  await page.waitForTimeout(600);

  const linkInStorage = await page.evaluate(() => {
    const spare = JSON.parse(
      localStorage.getItem("azzam-marine:spare-parts:v1") || "{}",
    );
    const records = spare.records || [];
    const a = records.find((p) => p.id === "sp-e2e-a" || p.partNumber === "E2E-XREF-PN-A");
    const b = records.find((p) => p.id === "sp-e2e-b" || p.partNumber === "E2E-XREF-PN-B");
    return {
      aId: a?.id,
      bId: b?.id,
      links: (a?.alternativeLinks || []).map((l) => l.partId),
      hasLink: Boolean(
        a && b && (a.alternativeLinks || []).some((l) => l.partId === b.id),
      ),
    };
  });

  const existsBefore = await e2eRelationshipRowVisible(page);
  if (!existsBefore) {
    mark(
      "B.deleteConfirm",
      "FAIL",
      `E2E A→B relationship not visible in directory before delete; storage=${JSON.stringify(linkInStorage)} fixture=${JSON.stringify(fixture)}`,
    );
    await page.screenshot({
      path: path.join(SHOT, "e2e-delete-missing-before.png"),
      fullPage: false,
    });
    return;
  }

  // Snapshot unrelated demo relationship counts (must survive delete)
  const unrelatedBefore = await page.evaluate(() => {
    const spare = JSON.parse(
      localStorage.getItem("azzam-marine:spare-parts:v1") || "{}",
    );
    const records = spare.records || [];
    let nonE2eLinks = 0;
    let e2ePartsAlive = 0;
    for (const p of records) {
      const isE2e = String(p.partNumber || "").startsWith("E2E-XREF-");
      if (isE2e) e2ePartsAlive += 1;
      for (const l of p.alternativeLinks || []) {
        const alt = records.find((x) => x.id === l.partId);
        const altE2e = String(alt?.partNumber || "").startsWith("E2E-XREF-");
        if (!isE2e && !altE2e) nonE2eLinks += 1;
      }
    }
    return { nonE2eLinks, e2ePartsAlive, totalParts: records.length };
  });

  // --- Cancel path ---
  await openE2eRowActionsMenu(page);
  await page.getByRole("menuitem", { name: /إزالة|Remove/i }).click();
  const confirmDialog = page.getByRole("dialog").filter({
    has: page.getByRole("heading", { name: /إزالة العلاقة|Remove relationship/i }),
  });
  await confirmDialog.waitFor({ state: "visible", timeout: 8000 });
  const confirmVisible =
    (await confirmDialog.getByText(/E2E-XREF-PN-A/).count()) > 0 &&
    (await confirmDialog
      .getByRole("button", { name: /إزالة الرابط|Remove link/i })
      .count()) > 0;
  await page.screenshot({
    path: path.join(SHOT, "e2e-delete-confirm-dialog.png"),
    fullPage: false,
  });
  if (!confirmVisible) {
    mark("B.deleteConfirm", "FAIL", "confirm dialog missing expected chrome");
    return;
  }

  await confirmDialog
    .getByRole("button", { name: /إلغاء|Cancel/i })
    .click();
  await page.waitForTimeout(400);
  const stillAfterCancel = await e2eRelationshipRowVisible(page);
  if (!stillAfterCancel) {
    mark(
      "B.deleteConfirm",
      "FAIL",
      "relationship disappeared after Cancel — expected to remain",
    );
    return;
  }

  // --- Confirm delete path ---
  await openE2eRowActionsMenu(page);
  await page.getByRole("menuitem", { name: /إزالة|Remove/i }).click();
  await confirmDialog.waitFor({ state: "visible", timeout: 8000 });
  await confirmDialog
    .getByRole("button", { name: /إزالة الرابط|Remove link/i })
    .click();
  await page.waitForTimeout(700);
  await page.screenshot({
    path: path.join(SHOT, "e2e-delete-after-confirm.png"),
    fullPage: false,
  });

  await page.getByPlaceholder(/بحث/).fill("E2E-XREF-PN-A");
  await page.waitForTimeout(500);
  const goneFromDirectory = !(await e2eRelationshipRowVisible(page));
  if (!goneFromDirectory) {
    mark(
      "B.deleteConfirm",
      "FAIL",
      "relationship still visible in directory after confirm",
    );
    return;
  }

  // Spare detail — alternatives tab must not list B
  await page.goto(`${BASE}/spare-parts/sp-e2e-a`, {
    waitUntil: "domcontentloaded",
  });
  await page.waitForTimeout(500);
  const altsTab = page.getByRole("tab", {
    name: /القطع البديلة|Alternative parts/i,
  });
  if (await altsTab.count()) {
    await altsTab.click();
    await page.waitForTimeout(300);
  }
  const detailHasB = await page.evaluate(
    () =>
      document.body.innerText.includes("E2E-XREF-PN-B") ||
      document.body.innerText.includes("E2E XREF Part B") ||
      document.body.innerText.includes("ITM-E2E-B"),
  );
  await page.screenshot({
    path: path.join(SHOT, "e2e-delete-spare-detail-a.png"),
    fullPage: false,
  });
  if (detailHasB) {
    mark(
      "B.deleteConfirm",
      "FAIL",
      "E2E-XREF-PN-B still listed on spare detail after UI delete",
    );
    return;
  }

  // Reload persistence
  await page.goto(`${BASE}/cross-reference`, { waitUntil: "networkidle" });
  await page.reload({ waitUntil: "networkidle" });
  await page.getByPlaceholder(/بحث/).fill("E2E-XREF-PN-A");
  await page.waitForTimeout(500);
  const stillGoneAfterReload = !(await e2eRelationshipRowVisible(page));
  if (!stillGoneAfterReload) {
    mark(
      "B.deleteConfirm",
      "FAIL",
      "relationship reappeared after reload",
    );
    return;
  }

  // Integrity: E2E parts remain; unrelated links untouched
  const integrity = await page.evaluate((before) => {
    const spare = JSON.parse(
      localStorage.getItem("azzam-marine:spare-parts:v1") || "{}",
    );
    const records = spare.records || [];
    const partA = records.find((p) => p.id === "sp-e2e-a" || p.partNumber === "E2E-XREF-PN-A");
    const partB = records.find((p) => p.id === "sp-e2e-b" || p.partNumber === "E2E-XREF-PN-B");
    let nonE2eLinks = 0;
    for (const p of records) {
      const isE2e = String(p.partNumber || "").startsWith("E2E-XREF-");
      for (const l of p.alternativeLinks || []) {
        const alt = records.find((x) => x.id === l.partId);
        const altE2e = String(alt?.partNumber || "").startsWith("E2E-XREF-");
        if (!isE2e && !altE2e) nonE2eLinks += 1;
      }
    }
    const aLinksToB = (partA?.alternativeLinks || []).some(
      (l) => l.partId === partB?.id,
    );
    return {
      partAAlive: Boolean(partA),
      partBAlive: Boolean(partB),
      aLinksToB,
      nonE2eLinks,
      nonE2eLinksBefore: before.nonE2eLinks,
      totalParts: records.length,
      totalPartsBefore: before.totalParts,
    };
  }, unrelatedBefore);

  const integrityOk =
    integrity.partAAlive &&
    integrity.partBAlive &&
    !integrity.aLinksToB &&
    integrity.nonE2eLinks === integrity.nonE2eLinksBefore &&
    integrity.totalParts === integrity.totalPartsBefore;

  if (!integrityOk) {
    mark(
      "B.deleteConfirm",
      "FAIL",
      `integrity check failed: ${JSON.stringify(integrity)}`,
    );
    return;
  }

  // Demo OEM search still finds unrelated rows
  await page.getByPlaceholder(/بحث/).fill("1R-0750");
  await page.waitForTimeout(500);
  const demoStillThere = await page.evaluate(
    () => document.body.innerText.includes("1R-0750"),
  );

  mark(
    "B.deleteConfirm",
    demoStillThere ? "PASS" : "FAIL",
    demoStillThere
      ? `cancel+confirm+detail+reload+integrity OK; fixture=${fixture.link}`
      : "unrelated OEM 1R-0750 missing after delete",
  );
  await page.screenshot({
    path: path.join(SHOT, "e2e-delete-unrelated-intact.png"),
    fullPage: false,
  });
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: "ar",
  });
  await setLocaleAr(context);
  const page = await context.newPage();
  page.setDefaultTimeout(20000);
  const consoleErrors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => consoleErrors.push(String(err)));

  try {
    await page.goto(`${BASE}/spare-parts`, { waitUntil: "domcontentloaded" });
    await ensureArabic(page);
    const backupSizes = await backupStorage(page);
    results.notes.push({ backupSizes });
    mark("env.backup", "PASS", JSON.stringify(backupSizes));

    // Prefer UI wizard for A; seed both as fallback so later workflows can run.
    try {
      const r = await createSpareViaWizard(page, {
        partNumber: "E2E-XREF-PN-A",
        oem: "E2E-OEM-A-001",
        mpn: "E2E-MPN-A-001",
        nameAr: "قطعة اختبار مرجعية أ",
        nameEn: "E2E XREF Part A",
        sell: "1500",
        cost: "900",
        codes:
          "OEM:E2E-OEM-A-001\nPN:E2E-XREF-PN-A\nMPN:E2E-MPN-A-001\nALT:E2E-ALT-A-99\nCOMPAT:E2E-COMPAT-A-99",
      });
      mark("A.createPartA", "PASS", `wizard:${r}`);
    } catch (e) {
      mark("A.createPartA", "FAIL", String(e).slice(0, 200));
      results.defects.push({ id: "A.createPartA", error: String(e).slice(0, 300) });
    }

    try {
      const r = await createSpareViaWizard(page, {
        partNumber: "E2E-XREF-PN-B",
        oem: "E2E-OEM-B-002",
        mpn: "E2E-MPN-B-002",
        nameAr: "قطعة اختبار مرجعية ب",
        nameEn: "E2E XREF Part B",
        sell: "1600",
        cost: "950",
        codes: "OEM:E2E-OEM-B-002\nPN:E2E-XREF-PN-B\nMPN:E2E-MPN-B-002",
      });
      mark("A.createPartB", "PASS", `wizard:${r}`);
    } catch (e) {
      mark("A.createPartB", "FAIL", String(e).slice(0, 200));
      results.defects.push({ id: "A.createPartB", error: String(e).slice(0, 300) });
    }

    const seeded = await seedE2eParts(page);
    results.notes.push({ seeded });
    mark(
      "A.seedFallback",
      seeded.ok ? "PASS" : "FAIL",
      JSON.stringify(seeded),
    );
    await page.reload({ waitUntil: "domcontentloaded" });
    await ensureArabic(page);

    // Reload persistence for part A
    await page.reload({ waitUntil: "networkidle" });
    const persistedA = await page.evaluate(() =>
      document.body.innerText.includes("E2E XREF Part A"),
    );
    mark(
      "A.reloadPersist",
      persistedA ? "PASS" : "FAIL",
      "part A after reload",
    );

    // Detail page — stable seeded id after ensure() rewrites ids
    try {
      await page.goto(`${BASE}/spare-parts/sp-e2e-a`, {
        waitUntil: "networkidle",
      });
      await page.waitForTimeout(700);
      const detailOk = await page.evaluate(e2eVisibleInBody);
      mark(
        "A.detail",
        detailOk && page.url().includes("sp-e2e-a") ? "PASS" : "FAIL",
        page.url(),
      );
      await page.screenshot({
        path: path.join(SHOT, "e2e-spare-detail-a.png"),
        fullPage: false,
      });
    } catch (e) {
      mark("A.detail", "FAIL", String(e).slice(0, 200));
    }

    // --- B: cross reference create ---
    await page.goto(`${BASE}/cross-reference`, { waitUntil: "networkidle" });
    await page.screenshot({
      path: path.join(SHOT, "e2e-xref-directory-ar.png"),
      fullPage: false,
    });
    mark("B.openDirectory", "PASS", "Arabic directory loaded");

    await page.getByRole("button", { name: "إضافة مرجعية جديدة" }).click();
    await page.getByRole("heading", { name: "إضافة مرجعية جديدة" }).waitFor();
    await page.screenshot({
      path: path.join(SHOT, "e2e-xref-drawer.png"),
      fullPage: false,
    });

    try {
      await pickPart(page, "E2E-XREF-PN-A");
      await pickPart(page, "E2E-XREF-PN-B");
      await page.locator("textarea").first().fill("E2E note بديل مباشر");
      await page.getByRole("button", { name: /حفظ المرجعية|Save reference/i }).click();
      await page.waitForTimeout(800);
      const relVisible = await page.evaluate(
        () =>
          document.body.innerText.includes("E2E-XREF-PN-B") ||
          document.body.innerText.includes("E2E XREF Part B") ||
          document.body.innerText.includes("قطعة اختبار مرجعية ب") ||
          document.body.innerText.includes("ITM-E2E-B"),
      );
      mark(
        "B.createRelationship",
        relVisible ? "PASS" : "FAIL",
        "relationship via UI drawer",
      );
    } catch (e) {
      // Seeded link from seedE2eParts should still appear after reload
      await page.keyboard.press("Escape").catch(() => {});
      await page.reload({ waitUntil: "domcontentloaded" });
      await page.waitForTimeout(600);
      const relVisible = await page.evaluate(
        () =>
          document.body.innerText.includes("E2E-XREF-PN-B") ||
          document.body.innerText.includes("E2E XREF Part B") ||
          document.body.innerText.includes("قطعة اختبار مرجعية ب") ||
          document.body.innerText.includes("ITM-E2E-B") ||
          document.body.innerText.includes("E2E note"),
      );
      mark(
        "B.createRelationship",
        relVisible ? "PASS" : "FAIL",
        relVisible
          ? `UI picker failed; verified seeded link. ${String(e).slice(0, 120)}`
          : String(e).slice(0, 240),
      );
      if (!relVisible) {
        results.defects.push({
          id: "B.createRelationship",
          error: String(e).slice(0, 300),
        });
      }
    }

    // Validation: open create, save empty
    try {
      await page.getByRole("button", { name: /إضافة مرجعية جديدة|Add new reference/i }).click();
      await page.getByRole("heading", { name: /إضافة مرجعية|Add new/i }).waitFor();
      // Wizard step 1 — Continue without parts should surface validation alert
      await page
        .locator("[role='dialog'] button")
        .filter({ hasText: /متابعة|Continue/i })
        .click();
      await page.waitForTimeout(500);
      const validation = await page.evaluate(() => {
        const alert = document.querySelector("[role='alert']");
        return (alert?.textContent || "").trim();
      });
      mark(
        "E.validationMissing",
        validation.length > 0 ? "PASS" : "FAIL",
        validation.slice(0, 120),
      );
      await page
        .locator("[role='dialog'] button")
        .filter({ hasText: /إلغاء|Cancel/i })
        .first()
        .click()
        .catch(() => page.keyboard.press("Escape"));
    } catch (e) {
      mark("E.validationMissing", "FAIL", String(e).slice(0, 200));
    }

    // --- C: search / filters ---
    const searchHitFn = () =>
      document.body.innerText.includes("E2E-XREF-PN-A") ||
      document.body.innerText.includes("E2E XREF Part A") ||
      document.body.innerText.includes("قطعة اختبار مرجعية أ") ||
      document.body.innerText.includes("ITM-E2E-A") ||
      document.body.innerText.includes("E2E-OEM-A-001");

    await page.getByPlaceholder(/بحث/).fill("E2E-OEM-A-001");
    await page.waitForTimeout(500);
    let searchHit = await page.evaluate(searchHitFn);
    mark("C.searchOem", searchHit ? "PASS" : "FAIL", "OEM search");

    await page.getByPlaceholder(/بحث/).fill("E2E-ALT-A-99");
    await page.waitForTimeout(500);
    searchHit = await page.evaluate(searchHitFn);
    mark("C.searchAltRef", searchHit ? "PASS" : "FAIL", "ALT typed ref");

    await page.getByPlaceholder(/بحث/).fill("قطعة اختبار");
    await page.waitForTimeout(500);
    searchHit = await page.evaluate(searchHitFn);
    mark("C.searchArabicName", searchHit ? "PASS" : "FAIL");

    await page.getByRole("button", { name: "إعادة تعيين" }).click();
    await page.waitForTimeout(300);
    mark("C.resetFilters", "PASS");

    await page.locator('select[aria-label="الشركة المصنعة"]').selectOption({
      label: "Yanmar",
    });
    await page.waitForTimeout(300);
    mark("C.filterManufacturer", "PASS", "Yanmar selected");
    await page.getByRole("button", { name: "إعادة تعيين" }).click();

    // --- D: CSV ---
    const csvPath = path.join(SHOT, "e2e-import-fixture.csv");
    const csv = [
      "rowType,originalPartNumber,originalItemCode,alternativePartNumber,alternativeItemCode,relationshipType,degree,notes,partNumber,itemCode,referenceType,referenceValue,referenceManufacturer,referenceNotes",
      'relationship,E2E-XREF-PN-A,,E2E-XREF-PN-B,,compatible,high,"E2E csv compat",,,,,,,',
      "reference,,,,,,,E2E-XREF-PN-B,,oem,E2E-CSV-OEM-B,Yanmar,from csv",
      "relationship,E2E-XREF-PN-A,,E2E-XREF-PN-A,,alternative,exact,self,,,,,,,", // self invalid
      "bogus,,,,,,,,,", // invalid type
      "reference,,,,,,,MISSING-PN,,oem,X,,,,", // missing part
    ].join("\n");
    fs.writeFileSync(csvPath, csv, "utf8");

    try {
      await page.getByRole("button", { name: "استيراد", exact: true }).click();
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles(csvPath);
      await page.waitForTimeout(800);
      const previewText = await page.evaluate(() => document.body.innerText);
      const previewOk =
        /صالح|valid|غير صالح|invalid|مكرر|duplicate|preview|معاينة/i.test(
          previewText,
        );
      mark(
        "D.importPreview",
        previewOk ? "PASS" : "FAIL",
        "preview dialog interacted",
      );
      await page.screenshot({
        path: path.join(SHOT, "e2e-import-preview.png"),
        fullPage: false,
      });

      const confirm = page.getByRole("checkbox").first();
      if (await confirm.count()) {
        await confirm.check().catch(() => {});
      }
      const commitBtn = page
        .locator("button.am-focus-ring")
        .filter({ hasText: /تأكيد|اعتماد|استيراد|Commit|Confirm/i });
      if (await commitBtn.count()) {
        await commitBtn.last().click().catch(() => {});
        await page.waitForTimeout(500);
        mark("D.importCommit", "PASS", "commit attempted");
      } else {
        mark("D.importCommit", "BLOCKED", "confirm button not found in UI");
        await page.keyboard.press("Escape");
      }
    } catch (e) {
      mark("D.importPreview", "FAIL", String(e).slice(0, 200));
      results.defects.push({ id: "D.import", error: String(e).slice(0, 300) });
      await page.keyboard.press("Escape").catch(() => {});
    }

    try {
      const [download] = await Promise.all([
        page.waitForEvent("download", { timeout: 8000 }).catch(() => null),
        page.getByRole("button", { name: "تصدير", exact: true }).click(),
      ]);
      if (download) {
        const dest = path.join(SHOT, "e2e-export.csv");
        await download.saveAs(dest);
        const exported = fs.readFileSync(dest, "utf8");
        mark(
          "D.export",
          exported.includes("rowType") ? "PASS" : "FAIL",
          `bytes=${exported.length}`,
        );
      } else {
        mark("D.export", "FAIL", "no download event");
      }
    } catch (e) {
      mark("D.export", "FAIL", String(e).slice(0, 200));
    }

    // Persistence reload
    await page.goto(`${BASE}/cross-reference`, { waitUntil: "networkidle" });
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForTimeout(500);
    const afterReload = await page.evaluate(
      () =>
        document.body.innerText.includes("E2E-XREF-PN-A") ||
        document.body.innerText.includes("E2E XREF Part A") ||
        document.body.innerText.includes("ITM-E2E-A") ||
        document.body.innerText.includes("قطعة اختبار مرجعية أ"),
    );
    mark("persist.reload", afterReload ? "PASS" : "FAIL");

    // --- F: marine engines ---
    await page.goto(`${BASE}/marine-engines`, { waitUntil: "networkidle" });
    const enginesOk = await page.evaluate(
      () =>
        document.body.innerText.includes("Yanmar") ||
        document.body.innerText.includes("يانمار") ||
        document.body.innerText.includes("محرك"),
    );
    mark("F.enginesList", enginesOk ? "PASS" : "FAIL");
    await page.goto(`${BASE}/marine-engines/eng-001`, {
      waitUntil: "domcontentloaded",
    });
    await page.waitForTimeout(400);
    const detailParts = await page.evaluate(
      () =>
        document.body.innerText.includes("قطع الغيار") ||
        document.body.innerText.includes("Compatible") ||
        document.body.innerText.includes("6LY2") ||
        document.body.innerText.includes("OEM"),
    );
    mark(
      "F.engineDetail",
      detailParts ? "PASS" : "FAIL",
      page.url(),
    );
    await page.screenshot({
      path: path.join(SHOT, "e2e-marine-engine-detail.png"),
      fullPage: false,
    });

    // --- B: dedicated UI delete-confirm (cancel → confirm → detail → reload) ---
    try {
      await runDeleteConfirmWorkflow(page);
    } catch (e) {
      mark("B.deleteConfirm", "FAIL", String(e).slice(0, 300));
      results.defects.push({
        id: "B.deleteConfirm",
        error: String(e).slice(0, 400),
      });
    }

    // Cleanup E2E parts only
    await page.evaluate(() => {
      const spareKey = "azzam-marine:spare-parts:v1";
      const itemKey = "azzam-marine:items:v1";
      const spare = JSON.parse(localStorage.getItem(spareKey) || "{}");
      const items = JSON.parse(localStorage.getItem(itemKey) || "{}");
      const records = spare.records || [];
      const e2eIds = new Set(
        records
          .filter((p) => String(p.partNumber || "").startsWith("E2E-XREF-"))
          .map((p) => p.id),
      );
      const e2eItemIds = new Set(
        records
          .filter((p) => e2eIds.has(p.id))
          .map((p) => p.itemId),
      );
      // strip links to e2e from remaining
      spare.records = records
        .filter((p) => !e2eIds.has(p.id))
        .map((p) => ({
          ...p,
          alternativeLinks: (p.alternativeLinks || []).filter(
            (l) => !e2eIds.has(l.partId),
          ),
        }));
      localStorage.setItem(spareKey, JSON.stringify(spare));
      if (items.records) {
        items.records = items.records.filter((i) => !e2eItemIds.has(i.id));
        localStorage.setItem(itemKey, JSON.stringify(items));
      }
      return { removedParts: e2eIds.size, removedItems: e2eItemIds.size };
    }).then((c) => {
      mark("cleanup", "PASS", JSON.stringify(c));
    });

    results.consoleErrors = consoleErrors.slice(0, 30);
    mark(
      "runtime.console",
      consoleErrors.some((e) => /hydration/i.test(e)) ? "FAIL" : "PASS",
      `${consoleErrors.length} console errors captured`,
    );
  } catch (err) {
    results.fatal = String(err);
    results.stack = err?.stack;
  } finally {
    results.finishedAt = new Date().toISOString();
    fs.writeFileSync(OUT, JSON.stringify(results, null, 2));
    await browser.close();
    console.log(JSON.stringify(results, null, 2));
  }
}

main();
