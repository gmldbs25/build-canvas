import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const dist = path.resolve("dist-pages");
const base = "https://gmldbs25.github.io/build-canvas/";
const pages = [
  { slug: "", title: "build _ canvas", card: "build _ canvas", subtitle: "Ideas, development, records", color: "#20262d", motif: "home" },
  { slug: "texas-trace", title: "TEXAS TRACE", card: "TEXAS TRACE", subtitle: "A map-first Texas journey", color: "#61452f", motif: "route" },
  { slug: "orca", title: "World Models × ORCA", card: "World Models x ORCA", subtitle: "An interactive AI story", color: "#19374d", motif: "waves" },
  { slug: "transformer-to-agent", title: "LLM to AGENT", card: "LLM to AGENT", subtitle: "From model to agent systems", color: "#223e4c", motif: "nodes" },
  { slug: "nand-flash", title: "컴퓨터가 기억하는 방식", card: "How Computers Remember", subtitle: "NAND flash, explained", color: "#35475b", motif: "chips" },
  { slug: "kotomachi", title: "KotoMachi를 만들며", card: "Building KotoMachi", subtitle: "A Japanese-learning RPG development journal", color: "#5b3f36", motif: "pixels" },
  { slug: "fab-flow-preview", title: "FAB FLOW", card: "FAB FLOW", subtitle: "Semiconductor logistics", color: "#284d48", motif: "rail" },
  { slug: "web-evolution", title: "The Evolution of the Web", card: "The Evolution of the Web", subtitle: "Seven eras of the Web", color: "#30425b", motif: "web" },
];
const escape = value => String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
const motif = {
  home: '<path d="M710 420h350v-190H710z M740 275h290 M740 320h190 M740 365h240"/>',
  route: '<path d="M720 400l80-170 120 130 110-160 80 100"/><circle cx="720" cy="400" r="14"/><circle cx="920" cy="360" r="14"/><circle cx="1110" cy="300" r="14"/>',
  waves: '<path d="M680 365q110-160 220 0t220 0 M680 410q110-160 220 0t220 0 M680 455q110-160 220 0t220 0"/>',
  nodes: '<path d="M720 235l180 85 180-85M720 405l180-85 180 85"/><circle cx="720" cy="235" r="24"/><circle cx="720" cy="405" r="24"/><circle cx="900" cy="320" r="40"/><circle cx="1080" cy="235" r="24"/><circle cx="1080" cy="405" r="24"/>',
  chips: '<rect x="760" y="190" width="300" height="260" rx="12"/><path d="M800 190v-35 M870 190v-35 M940 190v-35 M1010 190v-35 M800 450v35 M870 450v35 M940 450v35 M1010 450v35 M760 250h-40 M760 320h-40 M760 390h-40 M1060 250h40 M1060 320h40 M1060 390h40 M800 250h220 M800 320h220 M800 390h220"/>',
  pixels: '<path d="M760 440v-80h80v-80h80v-80h80v80h80v160z M920 440v-80h80v80"/>',
  rail: '<path d="M720 200h360v240H720z M720 320h360 M810 200v240 M990 200v240"/><rect x="785" y="295" width="50" height="50" rx="8"/><rect x="965" y="295" width="50" height="50" rx="8"/>',
  web: '<rect x="710" y="180" width="390" height="270" rx="14"/><path d="M710 245h390 M750 290h130v100H750z M910 290h150 M910 330h150 M910 370h110"/>',
};
await mkdir(path.join(dist, "share"), { recursive: true });
for (const page of pages) {
  const url = base + (page.slug ? page.slug + "/" : "");
  const imageName = (page.slug || "home") + ".png";
  const imageUrl = base + "share/" + imageName;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><rect width="1200" height="630" fill="${page.color}"/><rect x="44" y="44" width="1112" height="542" rx="14" fill="none" stroke="#c6d0cb" stroke-opacity=".32"/><g stroke="#d9e6e0" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity=".38">${motif[page.motif]}</g><text x="80" y="116" fill="#c6d0cb" font-family="sans-serif" font-size="23" letter-spacing="4">BUILD CANVAS</text><text x="80" y="296" fill="#f5f3ea" font-family="sans-serif" font-size="56" font-weight="700">${escape(page.card)}</text><text x="82" y="350" fill="#e1e8e4" font-family="sans-serif" font-size="27">${escape(page.subtitle)}</text><text x="82" y="540" fill="#c6d0cb" font-family="sans-serif" font-size="22">by heeyoon.</text></svg>`;
  await sharp(Buffer.from(svg)).png().toFile(path.join(dist, "share", imageName));
  const filename = path.join(dist, page.slug, "index.html");
  let html = await readFile(filename, "utf8");
  // Keep existing descriptions and metadata not related to sharing. Replace
  // duplicate social/canonical tags emitted by individual static renderers.
  const descriptionTag = html.match(/<meta\b[^>]*\bname=["']description["'][^>]*>/i)?.[0];
  const description = descriptionTag?.match(/\bcontent=["']([^"']*)["']/i)?.[1] || escape(page.subtitle);
  html = html.replace(/<meta\b[^>]*(?:property|name)=["'](?:og:[^"']+|twitter:[^"']+)["'][^>]*>/gi, "")
    .replace(/<link\b[^>]*\brel=["']canonical["'][^>]*>/gi, "");
  const tags = [
    `<link rel="canonical" href="${url}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:site_name" content="Build Canvas">`,
    `<meta property="og:title" content="${escape(page.title)}">`,
    `<meta property="og:description" content="${description}">`,
    `<meta property="og:url" content="${url}">`,
    `<meta property="og:image" content="${imageUrl}">`,
    `<meta property="og:image:width" content="1200">`,
    `<meta property="og:image:height" content="630">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${escape(page.title)}">`,
    `<meta name="twitter:description" content="${description}">`,
    `<meta name="twitter:image" content="${imageUrl}">`,
  ].join("\n");
  if (!/<\/head>/i.test(html)) throw new Error("Missing head in " + filename);
  await writeFile(filename, html.replace(/<\/head>/i, tags + "\n</head>"));
}
// Work 08 supplies its own share card and metadata.
const sitemapSlugs = [...pages.map(page => page.slug), "riemann-lean"];
// The unlisted personal archive intentionally stays outside the public sitemap.
await writeFile(path.join(dist, "sitemap.xml"), '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + sitemapSlugs.map(slug => '<url><loc>' + base + (slug ? slug + '/' : '') + '</loc></url>').join("\n") + '\n</urlset>\n');
await writeFile(path.join(dist, "robots.txt"), "User-agent: *\nAllow: /\nSitemap: " + base + "sitemap.xml\n");
await writeFile(path.join(dist, "404.html"), `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>404 · Build Canvas</title><style>body{margin:0;padding:clamp(24px,8vw,100px);font:16px/1.7 system-ui,sans-serif;background:#f6f5f1;color:#20262d}main{max-width:640px;margin:auto}h1{font-size:clamp(42px,12vw,84px);margin:0}a{color:inherit;text-underline-offset:4px}</style></head><body><main><p>build _ canvas</p><h1>404</h1><h2>페이지를 찾을 수 없습니다.</h2><p>주소가 변경되었거나 존재하지 않는 페이지입니다.</p><p><a href="${base}">← 작품 목록으로 돌아가기</a></p></main></body></html>`);
console.log("Pages metadata, share cards, sitemap, and 404 generated.");
