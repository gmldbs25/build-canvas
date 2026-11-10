import { mediaEntries } from "./entries.js";

const list = document.querySelector("#media-list");

function makePoster(entry, index) {
  const poster = document.createElement("img");
  poster.src = entry.image;
  poster.alt = entry.imageAlt ?? `${entry.title} 대표 이미지`;
  poster.width = 283;
  poster.height = 400;
  poster.decoding = "async";
  poster.loading = index < 2 ? "eager" : "lazy";
  poster.addEventListener("error", () => {
    const fallback = document.createElement("div");
    fallback.className = "poster-fallback";
    fallback.setAttribute("role", "img");
    fallback.setAttribute("aria-label", `${entry.title} 포스터를 불러올 수 없습니다`);
    fallback.textContent = entry.title;
    poster.parentElement?.replaceWith(fallback);
  }, { once: true });

  if (!entry.imageSource) {
    const frame = document.createElement("div");
    frame.className = "poster-link";
    frame.append(poster);
    return frame;
  }
  const link = document.createElement("a");
  link.className = "poster-link";
  link.href = entry.imageSource;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.setAttribute("aria-label", `${entry.title} 공식 이미지 출처 열기 (새 탭)`);
  link.append(poster);
  return link;
}

function makeCard(entry, index) {
  const card = document.createElement("li");
  card.className = "media-card";
  card.style.setProperty("--enter-index", Math.min(index, 6));

  const copy = document.createElement("div");
  copy.className = "card-copy";
  const heading = document.createElement("h2");
  heading.textContent = entry.title;
  const review = document.createElement("p");
  review.textContent = entry.review;
  copy.append(heading, review);

  card.append(makePoster(entry, index), copy);
  return card;
}

if (list) {
  const fragment = document.createDocumentFragment();
  for (const [index, entry] of mediaEntries.entries()) {
    fragment.append(makeCard(entry, index));
  }
  list.append(fragment);
}

document.addEventListener("keydown", (event) => {
  const target = event.target;
  if (
    event.key.toLowerCase() !== "h" ||
    event.metaKey || event.ctrlKey || event.altKey || event.isComposing ||
    (target instanceof Element &&
      target.closest("input, textarea, select, [contenteditable], [role='textbox']"))
  ) return;

  window.location.assign(new URL("../", window.location.href).href);
});
