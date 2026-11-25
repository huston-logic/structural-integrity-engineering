import { expect, test, type Page } from "@playwright/test";

// The site sets `scroll-behavior: smooth` on html (STYLE-GUIDE §9.1) unless the visitor prefers reduced motion. The
// other specs run with reduced motion, which switches smooth scrolling off, so this one asks for motion on purpose:
// with smooth scrolling on, a page change that does not land at the top is only visible here.
test.use({ reducedMotion: "no-preference" });

/** The scroll position once it has held still for 600ms (a smooth scroll that starts late would still be at 0 before). */
async function settledScrollY(page: Page): Promise<number> {
  let last = -1;
  let steady = 0;
  for (let i = 0; i < 60 && steady < 6; i += 1) {
    const y = await page.evaluate(() => Math.round(window.scrollY));
    steady = y === last ? steady + 1 : 0;
    last = y;
    await page.waitForTimeout(100);
  }
  return last;
}

/** Jump (not glide) to `y`, or to the bottom of a shorter page, so every case starts from a known position. */
async function jumpTo(page: Page, y: number) {
  await page.evaluate((top) => {
    document.documentElement.style.scrollBehavior = "auto";
    window.scrollTo(0, top);
    document.documentElement.style.scrollBehavior = "";
  }, y);
  const expected = await page.evaluate((top) => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    return Math.min(top, max);
  }, y);
  await expect.poll(() => page.evaluate(() => Math.round(window.scrollY))).toBeGreaterThanOrEqual(expected - 5);
}

// The common case is a click at the top of the page, then a click after scrolling down; both must land at the top.
const startPositions = [0, 1200];

for (const start of startPositions) {
  test(`the logo on /services opens the home page at the top (from scroll ${start})`, async ({ page }) => {
    await page.goto("/services");
    await jumpTo(page, start);
    await page.getByRole("banner").getByRole("link", { name: /Structural Integrity Engineering, home/ }).click();
    await expect(page).toHaveURL("/");
    expect(await settledScrollY(page)).toBe(0);
  });
}

for (const [from, to] of [
  ["/", "/services"],
  ["/services", "/about-us"],
  ["/about-us", "/contact-us"],
  ["/contact-us", "/services"],
] as const) {
  test(`a footer link from ${from} to ${to} opens the page at the top`, async ({ page }) => {
    await page.goto(from);
    await jumpTo(page, 100000);
    await page.getByRole("navigation", { name: "Footer" }).locator(`a[href="${to}"]`).first().click();
    await expect(page).toHaveURL(to);
    expect(await settledScrollY(page)).toBe(0);
  });
}

for (const start of startPositions) {
  test(`the header links open each page at the top (from scroll ${start})`, async ({ page }) => {
    const width = page.viewportSize()?.width ?? 0;
    test.skip(width < 1024, "The mobile menu is covered by the footer links above; the desktop bar is checked here.");
    for (const to of ["/services", "/about-us", "/contact-us"]) {
      await page.goto("/");
      await jumpTo(page, start);
      await page.getByRole("navigation", { name: "Main" }).locator(`a[href="${to}"]`).first().click();
      await expect(page).toHaveURL(to);
      expect(await settledScrollY(page), `landing position on ${to}`).toBe(0);
    }
  });
}
