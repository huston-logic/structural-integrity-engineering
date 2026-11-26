import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { siteConfig } from "../../site.config.ts";
import { renderMessage } from "./owner-page.ts";
import { ownerTheme } from "./theme.ts";

describe("ownerTheme", () => {
  const theme = ownerTheme(siteConfig.theme.colors);

  it("maps every role to a hex color or to the page's own fallback", () => {
    for (const [role, value] of Object.entries(theme)) {
      assert.ok(value === "" || /^#[0-9a-fA-F]{6}$/.test(value), `${role} is ${value}`);
    }
  });

  it("is what site.config.ts editor.pageColors holds, so the page the Worker draws wears Dusk", () => {
    assert.deepEqual({ ...siteConfig.editor.pageColors }, { ...theme });
  });

  it("uses Dusk's light color for the page and its dark color for the text", () => {
    assert.equal(theme.white, siteConfig.theme.colors.snow);
    assert.equal(theme.ink, siteConfig.theme.colors.night);
  });

  it("renders a page whose styles hold the site's colors", () => {
    const html = renderMessage({ siteName: "Example Co", siteUrl: "https://example.test", email: "owner@example.test", theme, title: "Done", body: "Done." });
    assert.ok(html.includes(siteConfig.theme.colors.snow));
    assert.ok(html.includes(siteConfig.theme.colors.night));
  });
});
