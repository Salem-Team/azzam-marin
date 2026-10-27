import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";

import {
  EMPTY_ITEM_SUPPLIER_FORM,
  validateItemSupplierForm,
} from "@/lib/item-suppliers/item-supplier-validation";
import {
  __rehydrateItemSupplierStoreForTests,
  __resetItemSupplierStoreForTests,
  createItemSupplierLink,
  findActiveLink,
  ItemSupplierLinkError,
  linkToFormValues,
  listItemSupplierLinks,
  listLinksForItem,
  listLinksForSupplier,
  removeItemSupplierLink,
  updateItemSupplierLink,
} from "@/lib/item-suppliers-store";
import {
  __resetItemsStoreForTests,
  createItem,
  getItemById,
  listItems,
  updateItem,
} from "@/lib/items-store";
import { EMPTY_ITEM_FORM } from "@/lib/items/item-validation";
import {
  __resetSuppliersStoreForTests,
  listSuppliers,
  setSupplierStatus,
  supplierToFormValues,
  updateSupplier,
} from "@/lib/suppliers-store";
import type { ItemFormValues } from "@/types/catalog";
import type { ItemSupplierLinkFormValues } from "@/types/item-supplier";

function ensureLocalStorage() {
  if (typeof globalThis.localStorage !== "undefined") {
    globalThis.localStorage.clear();
    return;
  }
  const map = new Map<string, string>();
  globalThis.localStorage = {
    get length() {
      return map.size;
    },
    clear() {
      map.clear();
    },
    getItem(key: string) {
      return map.has(key) ? map.get(key)! : null;
    },
    key(index: number) {
      return [...map.keys()][index] ?? null;
    },
    removeItem(key: string) {
      map.delete(key);
    },
    setItem(key: string, value: string) {
      map.set(key, value);
    },
  };
}

function itemForm(overrides: Partial<ItemFormValues> = {}): ItemFormValues {
  return {
    ...EMPTY_ITEM_FORM,
    itemCode: "ITM-LINK-01",
    nameEn: "Link Test Oil",
    nameAr: "زيت اختبار الربط",
    manufacturer: "Shell",
    countryCode: "DE",
    countryOfOrigin: "Germany",
    unitOfMeasure: "L",
    minStock: "10",
    costUsd: "12",
    sellUsd: "18",
    sellEgp: "900",
    ...overrides,
  };
}

function linkForm(
  supplierId: string,
  overrides: Partial<ItemSupplierLinkFormValues> = {},
): ItemSupplierLinkFormValues {
  return {
    ...EMPTY_ITEM_SUPPLIER_FORM,
    supplierId,
    supplierItemCode: "SUP-SKU-1",
    purchasePrice: "100",
    currency: "USD",
    leadTimeDays: "14",
    minimumOrderQuantity: "5",
    notes: "Quoted price",
    status: "active",
    ...overrides,
  };
}

describe("item↔supplier relationship store", () => {
  beforeEach(() => {
    ensureLocalStorage();
    __resetItemsStoreForTests([]);
    __resetSuppliersStoreForTests();
    __resetItemSupplierStoreForTests([]);
  });

  it("links an existing supplier to an item", () => {
    const item = createItem(itemForm());
    const supplier = listSuppliers()[0]!;
    const link = createItemSupplierLink(item.id, linkForm(supplier.id));
    assert.equal(link.itemId, item.id);
    assert.equal(link.supplierId, supplier.id);
    assert.equal(listLinksForItem(item.id).length, 1);
    assert.equal(listLinksForSupplier(supplier.id).length, 1);
  });

  it("links multiple suppliers to one item", () => {
    const item = createItem(itemForm());
    const [a, b] = listSuppliers();
    createItemSupplierLink(item.id, linkForm(a!.id));
    createItemSupplierLink(item.id, linkForm(b!.id, { supplierItemCode: "B" }));
    assert.equal(listLinksForItem(item.id).length, 2);
  });

  it("links multiple items to one supplier", () => {
    const supplier = listSuppliers()[0]!;
    const a = createItem(itemForm({ itemCode: "ITM-A" }));
    const b = createItem(itemForm({ itemCode: "ITM-B", nameEn: "B" }));
    createItemSupplierLink(a.id, linkForm(supplier.id));
    createItemSupplierLink(b.id, linkForm(supplier.id));
    assert.equal(listLinksForSupplier(supplier.id).length, 2);
  });

  it("prevents duplicate active item-supplier relationships", () => {
    const item = createItem(itemForm());
    const supplier = listSuppliers()[0]!;
    createItemSupplierLink(item.id, linkForm(supplier.id));
    assert.throws(
      () => createItemSupplierLink(item.id, linkForm(supplier.id)),
      (err: unknown) =>
        err instanceof ItemSupplierLinkError && err.code === "duplicate",
    );
  });

  it("rejects an unknown item id", () => {
    const supplier = listSuppliers()[0]!;
    assert.throws(
      () => createItemSupplierLink("missing-item", linkForm(supplier.id)),
      (err: unknown) =>
        err instanceof ItemSupplierLinkError && err.code === "unknown-item",
    );
  });

  it("rejects an unknown supplier id", () => {
    const item = createItem(itemForm());
    assert.throws(
      () => createItemSupplierLink(item.id, linkForm("missing-sup")),
      (err: unknown) =>
        err instanceof ItemSupplierLinkError && err.code === "unknown-supplier",
    );
  });

  it("prevents new relationships with inactive suppliers", () => {
    const item = createItem(itemForm());
    const supplier = listSuppliers()[0]!;
    setSupplierStatus(supplier.id, "inactive");
    assert.throws(
      () => createItemSupplierLink(item.id, linkForm(supplier.id)),
      (err: unknown) =>
        err instanceof ItemSupplierLinkError &&
        err.code === "inactive-supplier",
    );
  });

  it("preserves historical links when a supplier becomes inactive", () => {
    const item = createItem(itemForm());
    const supplier = listSuppliers()[0]!;
    const link = createItemSupplierLink(item.id, linkForm(supplier.id));
    setSupplierStatus(supplier.id, "inactive");
    assert.equal(listLinksForItem(item.id)[0]?.id, link.id);
    assert.ok(findActiveLink(item.id, supplier.id));
  });

  it("edits supplier-specific relationship data", () => {
    const item = createItem(itemForm());
    const supplier = listSuppliers()[0]!;
    const link = createItemSupplierLink(item.id, linkForm(supplier.id));
    const updated = updateItemSupplierLink(
      link.id,
      linkForm(supplier.id, {
        purchasePrice: "220.5",
        currency: "EGP",
        supplierItemCode: "NEW-CODE",
        leadTimeDays: "21",
      }),
    );
    assert.equal(updated.purchasePrice, 220.5);
    assert.equal(updated.currency, "EGP");
    assert.equal(updated.supplierItemCode, "NEW-CODE");
    assert.equal(updated.leadTimeDays, 21);
  });

  it("removes one relationship without deleting the supplier or item", () => {
    const item = createItem(itemForm());
    const supplier = listSuppliers()[0]!;
    const link = createItemSupplierLink(item.id, linkForm(supplier.id));
    assert.equal(removeItemSupplierLink(link.id), true);
    assert.equal(listLinksForItem(item.id).length, 0);
    assert.ok(getItemById(item.id));
    assert.ok(listSuppliers().some((s) => s.id === supplier.id));
  });

  it("preserves relationships when general item data changes", () => {
    const item = createItem(itemForm());
    const supplier = listSuppliers()[0]!;
    createItemSupplierLink(item.id, linkForm(supplier.id));
    updateItem(item.id, {
      ...itemForm({ itemCode: item.itemCode, nameEn: "Renamed Oil" }),
    });
    assert.equal(listLinksForItem(item.id).length, 1);
    assert.equal(getItemById(item.id)?.nameEn, "Renamed Oil");
  });

  it("preserves relationships when supplier contact details change", () => {
    const item = createItem(itemForm());
    const supplier = listSuppliers()[0]!;
    createItemSupplierLink(item.id, linkForm(supplier.id));
    const form = supplierToFormValues(supplier);
    updateSupplier(supplier.id, {
      ...form,
      phone: "+20-100-000-0000",
      email: "ops@example.com",
    });
    assert.equal(listLinksForSupplier(supplier.id).length, 1);
    const refreshed = listSuppliers().find((s) => s.id === supplier.id)!;
    assert.equal(refreshed.phone, "+20-100-000-0000");
  });

  it("reflects the same relationship on item and supplier views", () => {
    const item = createItem(itemForm());
    const supplier = listSuppliers()[0]!;
    const link = createItemSupplierLink(item.id, linkForm(supplier.id));
    assert.equal(listLinksForItem(item.id)[0]?.id, link.id);
    assert.equal(listLinksForSupplier(supplier.id)[0]?.id, link.id);
  });

  it("persists relationships after refresh", () => {
    const item = createItem(itemForm());
    const supplier = listSuppliers()[0]!;
    const link = createItemSupplierLink(item.id, linkForm(supplier.id));
    __rehydrateItemSupplierStoreForTests();
    const restored = listItemSupplierLinks().find((l) => l.id === link.id);
    assert.ok(restored);
    assert.equal(restored!.supplierId, supplier.id);
    assert.equal(restored!.itemId, item.id);
  });

  it("keeps cross-record isolation between item pairs", () => {
    const supplier = listSuppliers()[0]!;
    const a = createItem(itemForm({ itemCode: "ITM-ISO-A" }));
    const b = createItem(itemForm({ itemCode: "ITM-ISO-B", nameEn: "B" }));
    createItemSupplierLink(a.id, linkForm(supplier.id, { notes: "A only" }));
    assert.equal(listLinksForItem(b.id).length, 0);
    assert.equal(listLinksForItem(a.id)[0]?.notes, "A only");
  });

  it("validates currency and numeric fields", () => {
    const errors = validateItemSupplierForm(
      {
        ...EMPTY_ITEM_SUPPLIER_FORM,
        supplierId: "sup-yanmar",
        purchasePrice: "-1",
        currency: "",
        leadTimeDays: "1.5",
      },
      "en",
    );
    assert.ok(errors.purchasePrice);
    assert.ok(errors.leadTimeDays);

    const currencyErr = validateItemSupplierForm(
      {
        ...EMPTY_ITEM_SUPPLIER_FORM,
        supplierId: "sup-yanmar",
        purchasePrice: "10",
        currency: "",
      },
      "en",
    );
    assert.ok(currencyErr.currency);

    const ar = validateItemSupplierForm(
      { ...EMPTY_ITEM_SUPPLIER_FORM, supplierId: "" },
      "ar",
    );
    assert.ok(ar.supplierId);
  });

  it("rejects invalid price on create", () => {
    const item = createItem(itemForm());
    const supplier = listSuppliers()[0]!;
    assert.throws(
      () =>
        createItemSupplierLink(
          item.id,
          linkForm(supplier.id, { purchasePrice: "abc", currency: "USD" }),
        ),
      (err: unknown) =>
        err instanceof ItemSupplierLinkError && err.code === "invalid-price",
    );
  });

  it("does not delete sibling links when one is removed", () => {
    const item = createItem(itemForm());
    const [a, b] = listSuppliers();
    const linkA = createItemSupplierLink(item.id, linkForm(a!.id));
    createItemSupplierLink(item.id, linkForm(b!.id, { supplierItemCode: "B" }));
    removeItemSupplierLink(linkA.id);
    assert.equal(listLinksForItem(item.id).length, 1);
    assert.equal(listLinksForItem(item.id)[0]?.supplierId, b!.id);
  });

  it("round-trips form values for edit", () => {
    const item = createItem(itemForm());
    const supplier = listSuppliers()[0]!;
    const link = createItemSupplierLink(
      item.id,
      linkForm(supplier.id, { purchasePrice: "", currency: "" }),
    );
    const values = linkToFormValues(link);
    assert.equal(values.supplierId, supplier.id);
    assert.equal(values.purchasePrice, "");
    assert.equal(values.currency, "");
  });

  it("allows linking without a purchase price", () => {
    const item = createItem(itemForm({ itemCode: "ITM-NOPRICE" }));
    const supplier = listSuppliers()[0]!;
    const noPriceErr = validateItemSupplierForm(
      {
        ...EMPTY_ITEM_SUPPLIER_FORM,
        supplierId: supplier.id,
        purchasePrice: "",
        currency: "USD",
      },
      "en",
    );
    assert.equal(noPriceErr.purchasePrice, undefined);

    const link = createItemSupplierLink(
      item.id,
      linkForm(supplier.id, { purchasePrice: "", currency: "USD" }),
    );
    assert.equal(link.purchasePrice, null);
    assert.equal(link.currency, null);
  });

  it("leaves item catalog size unchanged when linking", () => {
    const before = listItems().length;
    const item = createItem(itemForm());
    const supplier = listSuppliers()[0]!;
    createItemSupplierLink(item.id, linkForm(supplier.id));
    assert.equal(listItems().length, before + 1);
    assert.equal(listSuppliers().length >= 1, true);
  });
});
