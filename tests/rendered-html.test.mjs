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
  assert.match(html, /by heeyoon\. ✦/);
  assert.match(html, /href="\.\/web-evolution\/"/);
  assert.match(html, /class="work-index-group"><span class="work-index">07<\/span><\/span><strong>The Evolution of the Web<\/strong>/);
  assert.equal((html.match(/class="work-status"/g) ?? []).length, 0);
  assert.ok(html.indexOf("The Evolution of the Web") < html.indexOf("FAB FLOW"));
  assert.match(html, /href="\.\/orca\/"/);
  assert.match(html, /href="\.\/texas-trace\/"/);
  assert.match(html, /href="\.\/nand-flash\/"/);
  assert.match(html, /href="\.\/kotomachi\/"/);
  assert.match(html, /class="work-index-group"><span class="work-index">05<\/span><\/span><strong>KotoMachi를 만들며<\/strong>/);
  assert.ok(html.indexOf("KotoMachi를 만들며") < html.indexOf("컴퓨터가 기억하는 방식"));
  assert.match(html, /class="work-index-group"><span class="work-index">04<\/span><\/span><strong>컴퓨터가 기억하는 방식<\/strong>/);
  assert.ok(html.indexOf("컴퓨터가 기억하는 방식") < html.indexOf("LLM to AGENT"));
  assert.ok(html.indexOf("ORCA") < html.indexOf("TEXAS TRACE"));
  assert.match(html, /class="work-index-group"><span class="work-index">02<\/span><\/span><strong>World Models × ORCA<\/strong>/);
  assert.match(html, /class="work-index-group"><span class="work-index">01<\/span><\/span><strong>TEXAS TRACE<\/strong>/);
  assert.doesNotMatch(html, /codex-preview/);
});
