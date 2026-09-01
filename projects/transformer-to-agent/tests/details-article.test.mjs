import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const contentSource = await readFile(new URL("../content/pages.ts", import.meta.url), "utf8");
const manuscriptSource = await readFile(
  new URL("../../../docs/transformer-to-agent/work3-details-article-v3.md", import.meta.url),
  "utf8",
);

const transpiledContent = ts.transpileModule(contentSource, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const { scenes } = await import(
  `data:text/javascript;base64,${Buffer.from(transpiledContent).toString("base64")}`
);

function normalizeInlineFormatting(value) {
  return value
    .replace(/^\d+\.\s+/, "")
    .replace(/\*\*/g, "")
    .replace(/`([^`]*)`/g, "$1")
    .trim();
}

function parseManuscript(source) {
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

    if (/^#{2,3} /.test(line)) {
      flushParagraph();
      continue;
    }

    if (line === "---") {
      flushParagraph();
      continue;
    }

    const listItem = line.match(/^(?:- |\d+\. )(.*)$/);
    if (listItem) {
      flushParagraph();
      push(listItem[1]);
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

function implementedCopy(scene) {
  return scene.details.flatMap((section) => [
    ...(section.paragraphs ?? []),
    ...(section.bullets ?? []),
    ...(section.code ?? []),
  ]).map(normalizeInlineFormatting);
}

test("implements the authoritative Details Article v3 without omissions or reordering", () => {
  const manuscriptByNumber = parseManuscript(manuscriptSource);

  assert.deepEqual(scenes.map((scene) => scene.number), [...manuscriptByNumber.keys()]);
  for (const scene of scenes) {
    assert.deepEqual(
      implementedCopy(scene),
      manuscriptByNumber.get(scene.number),
      `Scene ${scene.number} Details differ from work3-details-article-v3.md`,
    );
  }
});

test("keeps the required reveal timing and final mental-model guardrails", () => {
  const copyByNumber = Object.fromEntries(
    scenes.map((scene) => [scene.number, implementedCopy(scene).join("\n")]),
  );

  assert.doesNotMatch(copyByNumber["01"], /profile == null|Legacy User|Unknown/);
  assert.match(copyByNumber["13"], /profile == null/);
  assert.doesNotMatch(copyByNumber["13"], /expected: "Unknown"|fallback 계약/);
  assert.match(copyByNumber["14"], /expected: "Unknown"\nactual: null/);
  assert.match(copyByNumber["12"], /MODEL CONTEXT IS NOT THE ENTIRE AGENT STATE\./);
  assert.match(copyByNumber["16"], /Control과 Validation은 서로 관련이 있지만 같은 책임은 아니다\./);
  assert.doesNotMatch(copyByNumber["18"], /Working Directory/i);
  assert.match(copyByNumber["20"], /THE MODEL IS THE CORE\. THE SYSTEM MAKES IT AN AGENT\./);
  const appendixHeadings = scenes.find((scene) => scene.number === "A1").details
    .map((section) => section.title)
    .join("\n");
  assert.match(appendixHeadings, /Glossary/);
  assert.match(appendixHeadings, /Learning Check/);
  assert.match(appendixHeadings, /Simplification Notes/);
});

test("keeps article sections short enough for the Details reading surface", () => {
  const denseSections = scenes.flatMap((scene) => scene.details
    .filter((section) => (section.paragraphs?.length ?? 0) > 3)
    .map((section) => `${scene.number} · ${section.title}`));

  assert.deepEqual(denseSections, []);
});
