import assert from "node:assert/strict";
import test from "node:test";

test("renders the portfolio entry content", async () => {
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

  const html = await response.text();
  assert.equal(response.status, 200);
  assert.match(html, /<title>build _ canvas<\/title>/);
  assert.match(html, /생각, 그림,/);
  assert.match(html, /href="\.\/orca\/"/);
  assert.match(html, /href="\.\/texas-trace\/"/);
  assert.ok(html.indexOf("ORCA") < html.indexOf("TEXAS TRACE"));
  assert.match(html, />02<\/span><strong>ORCA<\/strong>/);
  assert.match(html, />01<\/span><strong>TEXAS TRACE<\/strong>/);
  assert.doesNotMatch(html, /codex-preview/);
});
