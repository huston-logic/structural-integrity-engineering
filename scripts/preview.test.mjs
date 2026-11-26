import { test } from "node:test";
import assert from "node:assert/strict";
import { request } from "node:http";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { gunzipSync } from "node:zlib";
import { startPreviewServer } from "./preview.mjs";

function makeOut() {
  const dir = mkdtempSync(join(tmpdir(), "preview-test-"));
  writeFileSync(join(dir, "index.html"), "<!doctype html><title>Home</title>");
  writeFileSync(join(dir, "404.html"), "<!doctype html><title>Not found</title>");
  writeFileSync(join(dir, "photo.jpg"), Buffer.from([0xff, 0xd8, 0xff, 0xd9]));
  writeFileSync(join(dir, "_headers"), "/*\n  X-Content-Type-Options: nosniff\n");
  return dir;
}

function get(port, path, acceptEncoding) {
  return new Promise((resolve, reject) => {
    const headers = acceptEncoding ? { "accept-encoding": acceptEncoding } : {};
    request({ port, path, headers }, (res) => {
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks) }));
    })
      .on("error", reject)
      .end();
  });
}

test("gzips text when the browser accepts it, and keeps the _headers block", async () => {
  const dir = makeOut();
  const server = await startPreviewServer({ outDir: dir, port: 0 });
  try {
    const res = await get(server.port, "/", "gzip, deflate, br");
    assert.equal(res.status, 200);
    assert.equal(res.headers["content-encoding"], "gzip");
    assert.equal(res.headers.vary, "Accept-Encoding");
    assert.equal(res.headers["x-content-type-options"], "nosniff");
    assert.equal(gunzipSync(res.body).toString(), "<!doctype html><title>Home</title>");
  } finally {
    await server.close();
    rmSync(dir, { recursive: true, force: true });
  }
});

test("sends plain text when the browser does not accept gzip", async () => {
  const dir = makeOut();
  const server = await startPreviewServer({ outDir: dir, port: 0 });
  try {
    const res = await get(server.port, "/");
    assert.equal(res.headers["content-encoding"], undefined);
    assert.equal(res.headers.vary, "Accept-Encoding", "Vary is sent on every compressible file, even when it is not gzipped");
    assert.equal(res.body.toString(), "<!doctype html><title>Home</title>");
  } finally {
    await server.close();
    rmSync(dir, { recursive: true, force: true });
  }
});

test("never gzips images, and gzips the 404 page with its 404 status", async () => {
  const dir = makeOut();
  const server = await startPreviewServer({ outDir: dir, port: 0 });
  try {
    const photo = await get(server.port, "/photo.jpg", "gzip");
    assert.equal(photo.headers["content-encoding"], undefined);
    assert.equal(photo.headers.vary, undefined, "an image is never varied by encoding");
    assert.deepEqual([...photo.body], [0xff, 0xd8, 0xff, 0xd9]);
    const missing = await get(server.port, "/nope", "gzip");
    assert.equal(missing.status, 404);
    assert.equal(gunzipSync(missing.body).toString(), "<!doctype html><title>Not found</title>");
  } finally {
    await server.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
