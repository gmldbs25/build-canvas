import { access, cp, mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const clientDir = path.join(projectRoot, "dist", "client");
const workerPath = path.join(projectRoot, "dist", "server", "index.js");
const outputDir = path.join(projectRoot, "dist-pages");
const basePath = (
  process.env.PAGES_BASE_PATH ?? "/build-canvas/transformer-to-agent"
).replace(/\/$/, "");

await Promise.all([access(clientDir), access(workerPath)]);

await rm(outputDir, { recursive: true, force: true });
await mkdir(outputDir, { recursive: true });
await cp(clientDir, outputDir, { recursive: true });

const workerUrl = pathToFileURL(workerPath);
workerUrl.searchParams.set("github-pages-export", `${Date.now()}`);
const { default: worker } = await import(workerUrl.href);

const response = await worker.fetch(
  new Request("https://gmldbs25.github.io/", {
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

if (!response.ok) {
  throw new Error(`Static render failed with HTTP ${response.status}.`);
}

let html = await response.text();

html = html
  .replace(/\.\/favicon\.svg/g, `${basePath}/favicon.svg`)
  .replace(new RegExp(`(?<!${basePath})/assets/`, "g"), `${basePath}/assets/`)
  .replace(
    new RegExp(`(?<!${basePath})/favicon\\.svg`, "g"),
    `${basePath}/favicon.svg`,
  );

if (!html.includes(`${basePath}/assets/`)) {
  throw new Error("The rendered page does not reference the GitHub Pages base path.");
}

if (new RegExp(`(?<!${basePath})/assets/`).test(html)) {
  throw new Error("The rendered page still contains root-relative asset URLs.");
}

for (const asset of [
  "agent-runtime-handoff.webp",
  "agent-runtime-handoff-appendix.webp",
  "dog-classification.webp",
]) {
  await access(path.join(outputDir, asset));
}

await Promise.all([
  writeFile(path.join(outputDir, "index.html"), html),
  writeFile(path.join(outputDir, "404.html"), html),
  writeFile(path.join(outputDir, ".nojekyll"), ""),
]);

console.log(`Transformer to Agent artifact ready: ${outputDir}`);
