import assert from "node:assert/strict";
import test from "node:test";
import { stripMetadata } from "./image-metadata.mjs";
import { makeWebp } from "../worker/uploads/fake-images.ts";
import { cleanWebp } from "../worker/uploads/webp-clean.ts";

// The Worker cleans photos with its own small walker; this keeps it from ever disagreeing with scripts/image-metadata.mjs,
// which the CI scope check uses on the same files.

const junk = (id, data) => Buffer.concat([Buffer.from(id, "latin1"), Buffer.from(new Uint32Array([data.length]).buffer), data, data.length % 2 ? Buffer.alloc(1) : Buffer.alloc(0)]);

function withExtra(webp, id, data) {
  const extra = junk(id, Buffer.from(data));
  const out = Buffer.concat([Buffer.from(webp), extra]);
  out.writeUInt32LE(out.length - 8, 4);
  return out;
}

test("the Worker's cleaned WebP has nothing left for image-metadata.mjs to remove", () => {
  for (const options of [{ size: 900 }, { size: 900, exif: true }, { size: 900, exif: true, xmp: true }]) {
    const cleaned = cleanWebp(makeWebp(options));
    assert.ok(cleaned);
    const report = stripMetadata(Buffer.from(cleaned), ".webp");
    assert.deepEqual(report.removed, [], JSON.stringify(options));
    assert.deepEqual(Buffer.from(report.bytes), Buffer.from(cleaned));
  }
});

test("both cleaners produce the same bytes for the same dirty file", () => {
  let dirty = Buffer.from(makeWebp({ size: 900, exif: true, xmp: true }));
  dirty = withExtra(dirty, "JUNK", [1, 2, 3]);
  dirty = withExtra(dirty, "ICCP", [4, 5, 6, 7]);
  const mine = cleanWebp(dirty);
  assert.ok(mine);
  assert.deepEqual(Buffer.from(mine), Buffer.from(stripMetadata(dirty, ".webp").bytes));
});

test("both cleaners refuse the same damaged file", () => {
  const damaged = Buffer.from(makeWebp({ size: 400 })).subarray(0, 100);
  assert.equal(cleanWebp(damaged), null);
  assert.throws(() => stripMetadata(damaged, ".webp"));
});
