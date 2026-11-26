import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { siteConfig } from "../../site.config";
import { renderConfirm, renderConsent, renderMessage, renderOwnerHome, type PageBase } from "../../worker/editor/owner-page";
import { ownerTheme } from "../../worker/editor/theme";

// Same tag set as site.a11y.spec.ts.
const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];

const base: PageBase = { siteName: "Example Co", siteUrl: "https://example.test", email: "owner@example.test", theme: ownerTheme(siteConfig.theme.colors) };
const proposal = {
  id: "p1",
  summary: "Update the opening hours",
  createdAt: "2026-01-01T12:00:00.000Z",
  changeList: "Page /about\n- Changes the heading to: Open Monday to Friday\n- Adds a block: a call to action with a very long unbroken value https://example.test/some/very/long/address/that/keeps/going/and/going",
  previewLink: "https://change-owner-p1-example.acct.workers.dev",
};

const states: Record<string, string> = {
  "home with items": renderOwnerHome({
    ...base,
    proposals: [proposal, { ...proposal, id: "p2", summary: "Add a new service" }],
    changes: [
      { change: 14, title: "Update the opening hours", state: "live", publishedAt: "2026-01-01T10:00:00.000Z", liveAt: "2026-01-01T10:05:00.000Z" },
      { change: 13, title: "Fix a typo", state: "stuck", publishedAt: "2026-01-01T09:00:00.000Z", failedChecks: ["check"] },
      { change: 12, title: "Rejected idea", state: "stopped", publishedAt: "2025-12-30T09:00:00.000Z" },
    ],
  }),
  "home empty": renderOwnerHome({ ...base, proposals: [], changes: [] }),
  "home unavailable": renderOwnerHome({ ...base, proposals: null, changes: null }),
  confirm: renderConfirm({ ...base, proposal }),
  consent: renderConsent({ ...base, handle: "h", clientName: "Claude", redirectHost: "claude.ai", redirectIsLoopback: false }),
  "consent loopback": renderConsent({ ...base, handle: "h", clientName: "A local app", clientDomain: "app.example.test", redirectHost: "127.0.0.1", redirectIsLoopback: true }),
  message: renderMessage({ ...base, title: "Published", body: "Change 15 was opened.\nIt is not live yet." }),
};

const sizes = [
  { name: "phone", width: 390, height: 844 },
  { name: "desktop", width: 1440, height: 900 },
];

for (const [state, html] of Object.entries(states)) {
  for (const size of sizes) {
    test(`owner page, ${state}, ${size.name}: no axe violations and no sideways scroll`, async ({ page }) => {
      await page.setViewportSize({ width: size.width, height: size.height });
      await page.setContent(html);
      const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
      expect(results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
      const fits = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
      expect(fits).toBe(true);
    });
  }
}
