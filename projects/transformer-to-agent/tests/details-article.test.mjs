import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const parserSource = await readFile(new URL("../content/details-parser.ts", import.meta.url), "utf8");
const loaderSource = await readFile(new URL("../content/details.ts", import.meta.url), "utf8");
const pagesSource = await readFile(new URL("../content/pages.ts", import.meta.url), "utf8");
const manuscriptSource = await readFile(
  new URL("../../../docs/transformer-to-agent/work3-details-article-v4.md", import.meta.url),
  "utf8",
);

const transpiledParser = ts.transpileModule(parserSource, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const { parseDetailsArticle } = await import(
  `data:text/javascript;base64,${Buffer.from(transpiledParser).toString("base64")}`
);

function normalizeInlineFormatting(value) {
  return value
    .replace(/^\d+\.\s+/, "")
    .replace(/^>\s?/, "")
    .replace(/\*\*/g, "")
    .replace(/`([^`]*)`/g, "$1")
    .trim();
}

function independentlyParseCopy(source) {
  const byNumber = new Map();
  let sceneNumber = null;
  let paragraph = [];
  let code = null;

  function push(value) {
    if (!sceneNumber) return;
    const normalized = normalizeInlineFormatting(value);
    if (normalized) byNumber.get(sceneNumber).push(normalized);
  }

  function flushParagraph() {
    if (paragraph.length) push(paragraph.join(" "));
    paragraph = [];
  }

  for (const line of source.split("\n")) {
    const sceneHeading = line.match(/^# (\d{2}|A1) — /);
    if (sceneHeading) {
      flushParagraph();
      sceneNumber = sceneHeading[1];
      byNumber.set(sceneNumber, []);
      continue;
    }
    if (!sceneNumber) continue;

    if (line.startsWith("```")) {
      if (code === null) {
        flushParagraph();
        code = [];
      } else {
        push(code.join("\n"));
        code = null;
      }
      continue;
    }
    if (code !== null) {
      code.push(line);
      continue;
    }
    if (/^#{2,3} /.test(line) || line === "---") {
      flushParagraph();
      continue;
    }

    const listItem = line.match(/^(?:- |\d+\. )(.*)$/);
    if (listItem) {
      flushParagraph();
      push(listItem[1]);
      continue;
    }
    if (line.startsWith(">")) {
      flushParagraph();
      push(line);
      continue;
    }
    if (!line.trim()) {
      flushParagraph();
      continue;
    }
    paragraph.push(line.trim());
  }

  flushParagraph();
  return byNumber;
}

function parsedCopy(scene) {
  return scene.blocks.flatMap((block) => {
    if (block.type === "heading") return [];
    if (block.type === "list") return block.items;
    if (block.type === "code") return [block.value];
    return [block.text];
  }).map(normalizeInlineFormatting);
}

test("uses Details Article v4 as the direct source of truth", () => {
  assert.match(loaderSource, /work3-details-article-v4\.md\?raw/);
  assert.match(loaderSource, /parseDetailsArticle\(detailsArticleSource\)/);
  assert.doesNotMatch(loaderSource, /article-v3|work3-redesign-spec/);
  assert.match(pagesSource, /Presentation sequence and Details v4 sequence differ/);
});

test("parses every Details v4 block without omission or reordering", () => {
  const parsed = parseDetailsArticle(manuscriptSource);
  const independent = independentlyParseCopy(manuscriptSource);
  const expectedOrder = [
    "00", "01", "02", "03", "04", "05", "06", "07", "08", "09",
    "10", "11", "12", "13", "14", "15", "16", "19", "A1",
  ];

  assert.deepEqual(parsed.order, expectedOrder);
  assert.deepEqual([...independent.keys()], expectedOrder);
  for (const number of expectedOrder) {
    assert.deepEqual(
      parsedCopy(parsed.byNumber[number]),
      independent.get(number),
      `Scene ${number} parser output differs from Details v4`,
    );
  }
});

test("keeps reveal timing and current technical guardrails", () => {
  const parsed = parseDetailsArticle(manuscriptSource);
  const copy = Object.fromEntries(
    parsed.order.map((number) => [number, parsedCopy(parsed.byNumber[number]).join("\n")]),
  );

  assert.doesNotMatch(copy["01"], /profile == null|Unknown/);
  assert.match(copy["13"], /profile == null/);
  assert.doesNotMatch(copy["13"], /expected: "Unknown"|actual: null/);
  assert.match(copy["14"], /expected: "Unknown"\nactual: null/);
  assert.match(copy["12"], /MODEL CONTEXT IS NOT THE ENTIRE AGENT STATE\./);
  assert.match(copy["16"], /Control과 Validation은 서로 관련이 있지만 같은 책임이 아니다\./);
  assert.match(copy["19"], /The system turns predictions into actions\./);
  assert.equal(copy["17"], undefined);
  assert.equal(copy["18"], undefined);
  assert.equal(copy["20"], undefined);

  const appendixHeadings = parsed.byNumber.A1.blocks
    .filter((block) => block.type === "heading")
    .map((block) => block.text)
    .join("\n");
  assert.match(appendixHeadings, /Conceptual Artwork/);
  assert.match(appendixHeadings, /Final Interpretation/);
  assert.match(appendixHeadings, /Glossary/);
});
