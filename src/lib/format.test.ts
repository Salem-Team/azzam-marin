import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { formatDateTime, formatTime } from "@/lib/format";

describe("format time — 12-hour product standard", () => {
  it("formats English with am/pm", () => {
    const out = formatTime("2026-10-21T22:04:00.000Z", "en");
    assert.match(out, /\d{1,2}:\d{2}/);
    assert.match(out.toLowerCase(), /am|pm/);
    assert.doesNotMatch(out, /^2[0-3]:/);
  });

  it("formats Arabic with 12-hour markers", () => {
    const out = formatTime("2026-10-21T22:04:00.000Z", "ar");
    // ar-EG 12h uses ص/م with Eastern Arabic digits (e.g. ١:٠٤ ص)
    assert.match(out, /[صم]/);
    assert.doesNotMatch(out, /^2[0-3]:\d{2}$/);
  });

  it("formatDateTime includes clock in 12-hour form", () => {
    const out = formatDateTime("2026-10-21T14:30:00.000Z", "en");
    assert.match(out.toLowerCase(), /am|pm/);
  });
});
