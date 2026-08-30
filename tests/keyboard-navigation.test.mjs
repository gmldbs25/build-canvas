import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const works = [
  ["Texas Trace", "../projects/texas-trace/assets/js/main.js"],
  ["ORCA", "../projects/orca/app/page.tsx"],
  ["LLM to AGENT", "../projects/transformer-to-agent/app/page.tsx"],
];

for (const [name, relativePath] of works) {
  test(`${name} supports the hidden Build Canvas Home shortcut safely`, async () => {
    const source = await readFile(new URL(relativePath, import.meta.url), "utf8");

    assert.match(source, /event\.key\.toLowerCase\(\)\s*===\s*["']h["']/);
    assert.match(source, /!event\.metaKey/);
    assert.match(source, /!event\.ctrlKey/);
    assert.match(source, /!event\.altKey/);
    assert.match(source, /!event\.isComposing/);
    assert.match(source, /!(?:isEditingTarget\(event\.target\)|isEditing\b)/);
    assert.match(source, /new URL\(["']\.\.\/["'],\s*window\.location\.href\)/);
    assert.match(source, /window\.location\.assign\(homeUrl\.href\)/);

    for (const editableSelector of [
      "input",
      "textarea",
      "select",
      "contenteditable",
      "role=\"textbox\"",
      "data-code-editor",
      "monaco-editor",
      "CodeMirror",
    ]) {
      assert.ok(source.includes(editableSelector), `${name} should ignore ${editableSelector}`);
    }
  });
}
