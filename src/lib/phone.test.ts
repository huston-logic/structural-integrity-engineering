import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { telHref } from "./phone.ts";

describe("telHref", () => {
  it("adds +1 to a 10-digit North American number", () => {
    assert.equal(telHref("(907) 350-3456"), "tel:+19073503456");
    assert.equal(telHref("907.350.3456"), "tel:+19073503456");
  });

  it("keeps a leading 1 or an explicit country code", () => {
    assert.equal(telHref("1 907 350 3456"), "tel:+19073503456");
    assert.equal(telHref("+44 20 7946 0958"), "tel:+442079460958");
  });

  it("returns null for anything it cannot dial", () => {
    assert.equal(telHref(""), null);
    assert.equal(telHref("[[Phone]]"), null);
    assert.equal(telHref("350-3456"), null);
  });
});
