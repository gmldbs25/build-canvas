import { mediaEntries } from "./entries.js";

const list = document.querySelector("#media-list");
const viewer = document.querySelector("#poster-viewer");
const viewerImage = document.querySelector("#poster-viewer-image");
const viewerTitle = document.querySelector("#poster-viewer-title");
const viewerClose = document.querySelector("#poster-viewer-close");
let lastPosterTrigger = null;

function openPoster(entry, trigger) {
  if (!viewer || !viewerImage || !viewerTitle || viewer.open) return;
  lastPosterTrigger = trigger;
  viewerImage.src = entry.image;
  viewerImage.alt = entry.imageAlt ?? `${entry.title} 대표 이미지`;
  viewerTitle.textContent = entry.title;
  viewer.showModal();
  document.body.classList.add("poster-open");
  viewerClose?.focus();
}

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

  const frame = document.createElement("button");
  frame.type = "button";
  frame.className = "poster-frame";
  frame.setAttribute("aria-label", `${entry.title} 포스터 확대 보기`);
  frame.addEventListener("click", () => openPoster(entry, frame));
  frame.append(poster);
  return frame;
}

function makeCard(entry, index) {
  const card = document.createElement("li");
  card.className = "media-card";
  card.style.setProperty("--enter-index", Math.min(index, 6));

  const copy = document.createElement("div");
  copy.className = "card-copy";
  const heading = document.createElement("h2");
  heading.textContent = entry.title;
  copy.append(heading);
  if (entry.review && entry.review.trim()) {
    const review = document.createElement("p");
    review.textContent = entry.review;
    copy.append(review);
  }

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

viewerClose?.addEventListener("click", () => viewer?.close());
viewer?.addEventListener("click", (event) => {
  // Tapping the dimmed area closes the viewer; tapping the image does not.
  if (event.target === viewer) viewer.close();
});
viewer?.addEventListener("close", () => {
  document.body.classList.remove("poster-open");
  viewerImage?.removeAttribute("src");
  if (lastPosterTrigger?.isConnected) lastPosterTrigger.focus();
  lastPosterTrigger = null;
});

document.addEventListener("keydown", (event) => {
  const target = event.target;
  if (
    viewer?.open ||
    event.key.toLowerCase() !== "h" ||
    event.metaKey || event.ctrlKey || event.altKey || event.isComposing ||
    (target instanceof Element &&
      target.closest("input, textarea, select, [contenteditable], [role='textbox']"))
  ) return;

  window.location.assign(new URL("../", window.location.href).href);
});
