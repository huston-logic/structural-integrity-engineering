import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page, type Route } from "@playwright/test";
import { noteForm, thanks } from "../../src/content/contact";
import { contactFields } from "../../src/content/contact-fields";

// The contact form against the static preview. The Worker isn't running here, so /api/contact is answered by
// page.route, and the Turnstile script is replaced by a stub that hands back a token (and, like the real widget, a
// new one after reset). Nothing leaves the machine.

const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];

const TURNSTILE_STUB = `(() => {
  let options = null;
  let count = 0;
  const issue = () => setTimeout(() => options.callback("test-token-" + ++count), 0);
  window.turnstile = {
    render(el, o) { options = o; issue(); return "w1"; },
    reset() { issue(); },
    remove() {},
  };
})();`;

type Answer = { status: number; body: unknown };

async function setUp(page: Page, answer: Answer) {
  const sent: Record<string, unknown>[] = [];
  await page.route("https://challenges.cloudflare.com/**", (route: Route) =>
    route.fulfill({ status: 200, contentType: "text/javascript", body: TURNSTILE_STUB }),
  );
  await page.route("**/api/contact", async (route: Route) => {
    sent.push(route.request().postDataJSON() as Record<string, unknown>);
    await route.fulfill({ status: answer.status, contentType: "application/json", body: JSON.stringify(answer.body) });
  });
  await page.goto("/contact-us", { waitUntil: "networkidle" });
  return sent;
}

const ANSWERS = {
  firstName: "Ada",
  lastName: "Lovelace",
  email: "ada@example.org",
  phone: "(907) 555-0100",
  location: "Anchorage, AK",
  scope: "Two-story addition with a new foundation.",
} as const;

async function fillValid(page: Page) {
  for (const field of contactFields) await page.getByLabel(field.label, { exact: true }).fill(ANSWERS[field.key]);
}

async function expectNoViolations(page: Page, label: string) {
  const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  expect(results.violations, `Accessibility violations on ${label}`).toEqual([]);
}

test("a valid note goes to /contact-us/thanks, and nothing personal is in the URL or the page", async ({ page }) => {
  const sent = await setUp(page, { status: 200, body: { ok: true, autoReply: true } });
  await fillValid(page);
  await page.getByRole("button", { name: noteForm.submitLabel }).click();

  await expect(page).toHaveURL(/\/contact-us\/thanks$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(thanks.heading);
  await expect(page.getByText(thanks.body)).toBeVisible();
  expect(page.url()).not.toMatch(/Ada|example\.org|907/);

  expect(sent).toHaveLength(1);
  expect(sent[0]).toMatchObject({ ...ANSWERS, company_fax: "", turnstileToken: "test-token-1" });
  await expectNoViolations(page, "/contact-us/thanks");
});

test("a failed send keeps the answers and shows the error", async ({ page }) => {
  await setUp(page, { status: 502, body: { ok: false, error: "failed" } });
  await fillValid(page);
  await page.getByRole("button", { name: noteForm.submitLabel }).click();
  await expect(page.getByRole("status").getByText(/^That didn't go through\. Please email .+ or call /)).toBeVisible();
  await expect(page).toHaveURL(/\/contact-us$/);
  await expect(page.getByLabel("First name", { exact: true })).toHaveValue("Ada");
  await expectNoViolations(page, "/contact-us (send failed)");
});

test("rate limits and refused checks show their own messages", async ({ page }) => {
  await setUp(page, { status: 429, body: { ok: false, error: "rate_limited" } });
  await fillValid(page);
  await page.getByRole("button", { name: noteForm.submitLabel }).click();
  await expect(page.getByRole("status").getByText(noteForm.sendErrors.rateLimited)).toBeVisible();

  await page.unroute("**/api/contact");
  await page.route("**/api/contact", (route: Route) =>
    route.fulfill({ status: 403, contentType: "application/json", body: JSON.stringify({ ok: false, error: "rejected" }) }),
  );
  await page.getByRole("button", { name: noteForm.submitLabel }).click();
  await expect(page.getByRole("status").getByText(noteForm.sendErrors.notVerified)).toBeVisible();
});

test("an empty submit shows the field errors and sends nothing", async ({ page }) => {
  const sent = await setUp(page, { status: 200, body: { ok: true, autoReply: true } });
  await page.getByRole("button", { name: noteForm.submitLabel }).click();
  for (const message of Object.values(noteForm.errors)) await expect(page.getByText(message)).toBeVisible();
  expect(sent).toHaveLength(0);
  await expectNoViolations(page, "/contact-us (field errors)");
});
