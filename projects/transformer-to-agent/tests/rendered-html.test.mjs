import assert from "node:assert/strict";
import test from "node:test";

test("renders the Work 03 opening with local assets and mode controls", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  const response = await worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );

  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>FROM TRANSFORMER TO AGENT SYSTEMS<\/title>/);
  assert.match(html, />Presentation</);
  assert.match(html, />Article</);
  assert.match(html, /\.\/agent-runtime-handoff\.webp/);
  assert.match(html, /PAGE[^<]*<.*01.*06/s);
  assert.doesNotMatch(html, /Template Lab/);
});
