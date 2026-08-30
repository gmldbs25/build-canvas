import assert from "node:assert/strict";
import test from "node:test";

test("renders the Work 3 introduction and presentation shell", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  const response = await worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );

  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>LLM to AGENT — 다음 Token 예측에서 Coding Agent까지<\/title>/);
  assert.match(html, /LLM/);
  assert.match(html, /AGENT/);
  assert.match(html, /다음 Token 예측에서 Coding Agent까지/);
  assert.match(html, /Scene navigation/);
  assert.doesNotMatch(html, /Article/);
  assert.doesNotMatch(html, /Template Lab/);
});
