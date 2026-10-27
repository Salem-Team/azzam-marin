import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";

import { DEMO_SESSION_USER_ID } from "@/lib/activity-actor";
import {
  __resetClientActivityStoreForTests,
  listClientActivity,
  recordClientActivity,
} from "@/lib/client-activity-store";

describe("client activity precision", () => {
  beforeEach(() => {
    __resetClientActivityStoreForTests();
  });

  it("stamps session user and ISO createdAt on every event", () => {
    const event = recordClientActivity({
      entityType: "spare_part",
      entityId: "sp-e2e-a",
      action: "link.create",
      summaryEn: "Linked alternative part",
      summaryAr: "تم ربط قطعة بديلة",
    });

    assert.equal(event.actorUserId, DEMO_SESSION_USER_ID);
    assert.ok(event.actorNameEn.length > 0);
    assert.ok(event.actorNameAr.length > 0);
    assert.ok(event.actorRoleEn.length > 0);
    assert.ok(event.actorRoleAr.length > 0);
    assert.match(event.createdAt, /^\d{4}-\d{2}-\d{2}T/);
    assert.ok(!Number.isNaN(Date.parse(event.createdAt)));

    const listed = listClientActivity();
    assert.equal(listed[0]?.id, event.id);
    assert.equal(listed[0]?.actorUserId, DEMO_SESSION_USER_ID);
  });

  it("rejects nothing but still requires meaningful fields at logClientActivity layer", () => {
    recordClientActivity({
      entityType: "item",
      entityId: "item-001",
      action: "update",
      summaryEn: "Updated item",
      summaryAr: "تم تحديث الصنف",
    });
    assert.equal(listClientActivity().length, 1);
  });
});
