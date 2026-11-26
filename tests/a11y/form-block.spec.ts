import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page, type Route } from "@playwright/test";
import { formWords } from "../../src/content/forms";
import { showcaseForm } from "../../src/forms/showcase";

// The form block on the block showcase (/blocks), which shows the example form in both variants. The Worker isn't
// running here, so the post is answered by page.route and Turnstile by a stub that hands back a token. Nothing leaves
// the machine.

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

const HEADING = "A short heading that says what the form is for";

async function setUp(page: Page, answer: { status: number; body: unknown }) {
  const sent: Record<string, unknown>[] = [];
  await page.route("https://challenges.cloudflare.com/**", (route: Route) => route.fulfill({ status: 200, contentType: "text/javascript", body: TURNSTILE_STUB }));
  await page.route("**/api/forms/showcase-example", async (route: Route) => {
    sent.push(route.request().postDataJSON() as Record<string, unknown>);
    await route.fulfill({ status: answer.status, contentType: "application/json", body: JSON.stringify(answer.body) });
  });
  await page.goto("/blocks", { waitUntil: "networkidle" });
  return sent;
}

const stacked = (page: Page) => page.getByRole("region", { name: HEADING, exact: true });

test("an empty submit announces each problem, marks the field and focuses the first one", async ({ page }) => {
  const sent = await setUp(page, { status: 200, body: { ok: true } });
  const form = stacked(page);
  await form.getByRole("button", { name: showcaseForm.button }).click();

  // name and message share the default text message; email and the buttons question have their own.
  await expect(form.getByText(formWords.errors["short-text"])).toHaveCount(2);
  await expect(form.getByText(formWords.errors.email)).toBeVisible();
  await expect(form.getByText(formWords.errors.dropdown)).toBeVisible();

  // Each invalid field is marked and points at an element that holds its error text.
  const problems: { label: string; error: string }[] = [
    { label: showcaseForm.fields[0]!.label, error: formWords.errors["short-text"] },
    { label: showcaseForm.fields[1]!.label, error: formWords.errors.email },
    { label: showcaseForm.fields[4]!.label, error: formWords.errors["short-text"] },
  ];
  for (const { label, error } of problems) {
    const control = form.getByLabel(label, { exact: true });
    await expect(control).toHaveAttribute("aria-invalid", "true");
    const described = (await control.getAttribute("aria-describedby")) ?? "";
    const texts = await control.evaluate((el, ids) => ids.split(" ").map((id) => el.ownerDocument.getElementById(id)?.textContent ?? ""), described);
    expect(texts.some((text) => text.includes(error)), `${label}: aria-describedby "${described}" reaches "${error}"`).toBe(true);
  }

  // The button-style question is a radio group: invalid itself, and each radio reaches the error line.
  const group = form.getByRole("radiogroup", { name: showcaseForm.fields[3]!.label });
  await expect(group).toHaveAttribute("aria-invalid", "true");
  for (const radio of await group.getByRole("radio").all()) {
    const described = (await radio.getAttribute("aria-describedby")) ?? "";
    const texts = await radio.evaluate((el, ids) => ids.split(" ").map((id) => el.ownerDocument.getElementById(id)?.textContent ?? ""), described);
    expect(texts.some((text) => text.includes(formWords.errors.dropdown))).toBe(true);
  }

  // Focus is on the first problem field.
  await expect(form.getByLabel(showcaseForm.fields[0]!.label, { exact: true })).toBeFocused();
  expect(sent).toHaveLength(0);

  const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  expect(results.violations, "Accessibility violations on /blocks (form errors)").toEqual([]);
});

test("a send that fails keeps the answers and says so in a status line", async ({ page }) => {
  await setUp(page, { status: 404, body: { ok: false, error: "not_found" } });
  const form = stacked(page);
  await form.getByLabel(showcaseForm.fields[0]!.label, { exact: true }).fill("Ada Lovelace");
  await form.getByLabel(showcaseForm.fields[1]!.label, { exact: true }).fill("ada@example.org");
  await form.getByText("A website", { exact: true }).click();
  await form.getByLabel(showcaseForm.fields[4]!.label, { exact: true }).fill("Hello.");
  await form.getByRole("button", { name: showcaseForm.button }).click();
  await expect(form.getByRole("status").getByText(formWords.sendErrors.failed)).toBeVisible();
  await expect(form.getByLabel(showcaseForm.fields[0]!.label, { exact: true })).toHaveValue("Ada Lovelace");
});

test("a real success replaces the panel with the thank-you, in the same height, and moves focus to it", async ({ page }) => {
  const sent = await setUp(page, { status: 200, body: { ok: true } });
  const form = stacked(page);
  await form.getByLabel(showcaseForm.fields[0]!.label, { exact: true }).fill("Ada Lovelace");
  await form.getByLabel(showcaseForm.fields[1]!.label, { exact: true }).fill("ada@example.org");
  await form.getByText("A website", { exact: true }).click();
  await form.getByLabel(showcaseForm.fields[4]!.label, { exact: true }).fill("Hello.");
  const panel = form.locator("form").locator("xpath=..");
  const before = (await panel.boundingBox())?.height ?? 0;
  await form.getByRole("button", { name: showcaseForm.button }).click();

  const thanks = form.getByText(showcaseForm.thanks);
  await expect(thanks).toBeVisible();
  await expect(form.getByRole("button")).toHaveCount(0);
  await expect(form.locator("[tabindex='-1']").first()).toBeFocused();
  expect((await form.locator("div.rounded-panel").boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(before - 1);
  expect(sent).toHaveLength(1);
  expect(sent[0]).toMatchObject({ name: "Ada Lovelace", email: "ada@example.org", interest: "A website", copy: false, updates: false, company_fax: "", turnstileToken: "test-token-1" });
});

test("the static HTML has every control and the no-JavaScript note", async ({ page }) => {
  const response = await page.request.get("/blocks");
  const html = await response.text();
  expect(html).toContain("This form needs JavaScript to send.");
  expect(html).toContain(showcaseForm.button);
  expect(html).toContain('method="post"');
  expect(html).not.toContain("/files/");
});
