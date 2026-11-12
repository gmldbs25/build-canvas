import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { mediaEntries } from "../extras/elsewhere/entries.js";

test("elsewhere cards stay data-driven and valid", () => {
  assert.equal(mediaEntries.length, 7);
  assert.match(mediaEntries[0].image, /^https:\/\/a\.storyblok\.com\//);
  assert.match(mediaEntries[0].image, /\/4090x5784\/.*\/m\/1200x0\/filters:quality\(88\):format\(webp\)$/);
  assert.deepEqual(mediaEntries.map((item) => item.title), [
    "진격의 거인",
    "귀멸의 칼날",
    "하이큐",
    "나의 히어로 아카데미아",
    "장송의 프리렌",
    "헌터x헌터",
    "강철의 연금술사",
  ]);
  const expectedReviews = [
    "거인이라는 자극적 소재 뒤의 “인간” 이야기. 인간 세상엔 영원한 악역도, 선인도 없다. 그냥 “만화” 로만 보기엔 너무 아까울 작품.",
    "정든 캐릭터들이 매 번 목숨을 걸고 싸운다, 과몰입러는 너무 사무치고 눈물난다. + 야무진 액션 작화는 봐도봐도 계속 보고싶음.",
    "가장 현실적인 두근거림이 느껴진다, 중고생으로 돌아간다면 온 마음 바쳐서 축구부활동 하고싶어요.",
    "소년 성장 스토리 정석, A반 전체에 애정 한가득 줘버림. 마지막시즌 작화 환상 + 바쿠고의 서사는 정말 ..",
    "모든게 느린 만화가 보는 내내 치유해주는 기분, “시간”에 대해 생각해보기 좋았다. + 전부 너무 귀여움",
    "곤과 키르아의 성장 이야기 만으로도 애정이 듬뿍 생긴다. 특히 키르아가 변해가는 모습을 아빠의 마음으로 본 느낌.",
    "현대에 진격거가 있다면 과거엔 강연금이 있다. 파괴, 복수, 용서하는 “인간”에 대해 계속 생각하게 한다."
];
  assert.deepEqual(mediaEntries.map((entry) => entry.review), expectedReviews);
  assert.equal(new Set(mediaEntries.map((entry) => entry.id)).size, mediaEntries.length);
  for (const entry of mediaEntries) {
    assert.ok(entry.id && entry.title && typeof entry.review === "string" && entry.image);
    assert.match(entry.image, /^https:\/\//);
  }
});

test("elsewhere is a static, isolated, mobile-first Pages route", async () => {
  const [page, stylesheet, buildFile, home] = await Promise.all([
    readFile(new URL("../extras/elsewhere/index.html", import.meta.url), "utf8"),
    readFile(new URL("../extras/elsewhere/style.css", import.meta.url), "utf8"),
    readFile(new URL("../scripts/build-pages.sh", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(page, /<h1>elsewhere\.<\/h1>/);
  assert.match(page, /한 문장씩 기록하기\./);
  assert.match(page, /name="viewport"/);
  assert.match(page, /noindex/);
  assert.match(stylesheet, /grid-template-columns:\s*94px/);
  assert.match(stylesheet, /prefers-reduced-motion/);
  assert.match(buildFile, /cp -R extras\/elsewhere\/\. dist-pages\/elsewhere\//);
  assert.match(home, /href="\.\/elsewhere\//);
  const renderer = await readFile(new URL("../extras/elsewhere/main.js", import.meta.url), "utf8");
  assert.match(renderer, /frame\.className = "poster-frame"/);
  assert.match(renderer, /document\.createElement\("button"\)/);
  assert.match(renderer, /viewer\.showModal\(\)/);
  assert.match(renderer, /event\.target === viewer/);
  assert.match(renderer, /lastPosterTrigger\.focus\(\)/);
  assert.match(renderer, /viewer\?\.open/);
  assert.match(page, /<dialog class="poster-dialog"/);
  assert.match(page, /id="poster-viewer-close"/);
  assert.match(page, /main\.js\?v=aot-poster-hd-1/);
  assert.match(renderer, /entries\.js\?v=aot-poster-hd-1/);
  assert.match(stylesheet, /\.poster-viewer-image/);
  assert.match(stylesheet, /max-height: calc\(100dvh - 140px\)/);
  assert.match(renderer, /if \(entry\.review && entry\.review\.trim\(\)\)/);
  assert.doesNotMatch(renderer, /document\.createElement\("a"\)/);
  assert.doesNotMatch(stylesheet, /\.poster-link/);
  assert.doesNotMatch(home, /index:\s*["']07["']/);
});
