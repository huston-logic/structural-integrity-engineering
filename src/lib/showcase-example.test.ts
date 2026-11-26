import assert from "node:assert/strict";
import { test } from "node:test";
import type { Context } from "../blocks/validate.ts";
import { collections } from "../collections/definitions.ts";
import { exampleBusiness } from "../content/showcase.ts";
import { businessDetailsView } from "./chrome-view.ts";
import { validateBusiness } from "../settings/business.ts";

const ctx: Context = { repo: { imageExists: () => true, fileExists: () => true }, pages: null };

test("the showcase's example business passes the business rules and fills every part of the block", () => {
  assert.deepEqual(validateBusiness(exampleBusiness, { ...ctx, repo: { ...ctx.repo } }).filter((problem) => !problem.includes("placeholder")), []);
  const view = businessDetailsView(exampleBusiness);
  assert.ok(view.address.length > 0 && view.contact.length === 2 && view.hours.length > 0 && view.hoursNote !== null);
  assert.equal(exampleBusiness.social.length, 2);
});

test("the example posts and team show both states: the first two have a photo with alt text, the third has none", () => {
  for (const [kind, field] of [["posts", "image"], ["team", "photo"]] as const) {
    const items = collections.find((c) => c.kind === kind)?.example ?? [];
    assert.equal(items.length, 3);
    for (const item of items.slice(0, 2)) {
      const image = item.data[field] as { src: string; alt: string } | undefined;
      assert.ok(image !== undefined && image.src.startsWith("/images/examples/") && image.alt.length > 10, `${kind} ${item.slug}`);
    }
    assert.equal(items[2]?.data[field], undefined);
  }
});
