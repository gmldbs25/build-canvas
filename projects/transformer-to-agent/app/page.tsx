"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { DetailsDrawer } from "@/components/details-drawer";
import { OverviewOverlay } from "@/components/overview-overlay";
import { Scene } from "@/components/scene";
import { scenes, TOTAL_SCENES } from "@/content/pages";

const DETAIL_SCROLL_STEP = 64;

function isEditingTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) return false;

  return Boolean(target.closest([
    "input",
    "textarea",
    "select",
    '[contenteditable]:not([contenteditable="false"])',
    '[role="textbox"]',
    "[data-code-editor]",
    ".monaco-editor",
    ".CodeMirror",
  ].join(", ")));
}

function indexFromLocation() {
  if (typeof window === "undefined") return 0;
  const params = new URLSearchParams(window.location.search);
  const requested = params.get("scene") ?? params.get("page");
  if (!requested) return 0;
  const byId = scenes.findIndex((scene) => scene.id === requested);
  if (byId >= 0) return byId;
  const byNumber = scenes.findIndex((scene) => scene.number.toLowerCase() === requested.toLowerCase());
  if (byNumber >= 0) return byNumber;
  const numeric = Number(requested);
  return Number.isFinite(numeric) ? Math.max(0, Math.min(TOTAL_SCENES - 1, numeric)) : 0;
}

export default function Home() {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [overviewOpen, setOverviewOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const detailsButtonRef = useRef<HTMLButtonElement>(null);
  const detailsScrollRef = useRef<HTMLDivElement>(null);
  const scene = scenes[index];
  const canGoBack = index > 0;
  const canGoForward = index < TOTAL_SCENES - 1;
  const sceneHasDetails = Boolean(scene.details?.length);

  const closeDetails = useCallback((restoreFocus = true) => {
    setDetailsOpen(false);
    if (restoreFocus) {
      window.setTimeout(() => detailsButtonRef.current?.focus(), 0);
    }
  }, []);

  const toggleDetails = useCallback(() => {
    if (detailsOpen) {
      closeDetails();
      return;
    }
    if (sceneHasDetails) setDetailsOpen(true);
  }, [closeDetails, detailsOpen, sceneHasDetails]);

  const navigate = useCallback((nextIndex: number, replace = false) => {
    const safeIndex = Math.max(0, Math.min(TOTAL_SCENES - 1, nextIndex));
    setDirection(safeIndex < index ? "backward" : "forward");
    setIndex(safeIndex);
    setDetailsOpen((isOpen) => isOpen && Boolean(scenes[safeIndex].details?.length));
    const url = new URL(window.location.href);
    url.searchParams.delete("mode");
    url.searchParams.delete("page");
    url.searchParams.set("scene", scenes[safeIndex].number);
    window.history[replace ? "replaceState" : "pushState"]({}, "", url);
  }, [index]);

  const selectFromOverview = useCallback((nextIndex: number) => {
    setOverviewOpen(false);
    navigate(nextIndex);
  }, [navigate]);

  useEffect(() => {
    const initialIndex = indexFromLocation();
    const timer = window.setTimeout(() => {
      setIndex(initialIndex);
      setReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const onPopState = () => {
      const nextIndex = indexFromLocation();
      setDirection(nextIndex < index ? "backward" : "forward");
      setIndex(nextIndex);
      setDetailsOpen((isOpen) => isOpen && Boolean(scenes[nextIndex].details?.length));
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [index]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isInteractive = Boolean(target?.closest("button, a, [tabindex]"));
      const isSceneNavigationControl = Boolean(
        target?.closest(".details-trigger, .scene-navigation"),
      );
      const isEditing = isEditingTarget(target);

      if (
        !event.metaKey
        && !event.ctrlKey
        && !event.altKey
        && !event.isComposing
        && event.key.toLowerCase() === "h"
        && !isEditing
      ) {
        event.preventDefault();
        const homeUrl = new URL("../", window.location.href);
        const isLocalHost = ["localhost", "127.0.0.1", "[::1]", "terminal.local"].includes(
          window.location.hostname,
        );
        if (isLocalHost && window.location.pathname === "/" && document.title !== "build _ canvas") {
          homeUrl.port = "5173";
        }
        window.location.assign(homeUrl.href);
        return;
      }

      if (event.key === "Escape" && (detailsOpen || overviewOpen)) {
        event.preventDefault();
        if (overviewOpen) setOverviewOpen(false);
        else closeDetails();
        return;
      }
      if (
        event.key.toLowerCase() === "o"
        && !event.repeat
        && !event.altKey
        && !event.ctrlKey
        && !event.metaKey
        && !isEditing
      ) {
        event.preventDefault();
        setOverviewOpen((isOpen) => !isOpen);
        return;
      }
      if (
        event.key.toLowerCase() === "d"
        && !event.repeat
        && !event.altKey
        && !event.ctrlKey
        && !event.metaKey
        && !isEditing
      ) {
        event.preventDefault();
        toggleDetails();
        return;
      }
      if (!isEditing && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
        event.preventDefault();
        if (detailsOpen) {
          detailsScrollRef.current?.scrollBy({
            top: event.key === "ArrowDown" ? DETAIL_SCROLL_STEP : -DETAIL_SCROLL_STEP,
            behavior: "auto",
          });
        }
        return;
      }
      if (isEditing || (!detailsOpen && isInteractive && !isSceneNavigationControl)) return;
      if (event.key === "ArrowLeft" && canGoBack) {
        event.preventDefault();
        navigate(index - 1);
      }
      if (event.key === "ArrowRight" && canGoForward) {
        event.preventDefault();
        navigate(index + 1);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [canGoBack, canGoForward, closeDetails, detailsOpen, index, navigate, overviewOpen, toggleDetails]);

  return (
    <main
      className="presentation"
      data-motion-paused={detailsOpen || overviewOpen}
      data-ready={ready}
      data-act={scene.act ?? "artwork"}
      data-tone={scene.tone}
    >
      {scene.act !== null && (
        <div
          className="act-indicator"
          aria-label={`ACT ${scene.act}, scene ${scene.actPosition} of ${scene.actSize}. 전체 ${TOTAL_SCENES}개 중 ${index + 1}번째`}
        >
          ACT {scene.act} <i /> {scene.actPosition}/{scene.actSize}
          <span className="act-rail" aria-hidden="true">
            {[1, 2, 3, 4, 5].map((act) => (
              <b key={act} data-state={act === scene.act ? "current" : act < scene.act! ? "done" : "upcoming"} />
            ))}
          </span>
        </div>
      )}

      {sceneHasDetails && (
        <button
          ref={detailsButtonRef}
          className="details-trigger"
          aria-controls="scene-details"
          aria-expanded={detailsOpen}
          aria-keyshortcuts="D"
          onClick={toggleDetails}
        >
          <span>Details</span>
          <kbd>D</kbd>
        </button>
      )}

      <div className="scene-viewport" aria-live="polite">
        <div className={`scene-transition scene-transition-${direction}`} key={scene.id}>
          <Scene sceneId={scene.id} motionPaused={detailsOpen || overviewOpen} />
        </div>
      </div>

      {!scene.hideCaption && (
        <div className="scene-caption-chrome" aria-hidden="true">
          <span>{scene.number}</span>
          <strong>{scene.title}</strong>
          <em>{index + 1} / {TOTAL_SCENES}</em>
        </div>
      )}
      {scene.act === null && (
        <p className="sr-only">{`전체 ${TOTAL_SCENES}개 중 ${index + 1}번째 화면`}</p>
      )}

      <nav className="scene-navigation" aria-label="Scene navigation">
        <button aria-label="이전 Scene" disabled={!canGoBack} onClick={() => navigate(index - 1)}>
          <ArrowLeft aria-hidden="true" />
        </button>
        <button aria-label="다음 Scene" disabled={!canGoForward} onClick={() => navigate(index + 1)}>
          <ArrowRight aria-hidden="true" />
        </button>
      </nav>

      <DetailsDrawer
        open={detailsOpen}
        scene={scene}
        scrollRef={detailsScrollRef}
        onClose={closeDetails}
      />
      <OverviewOverlay
        open={overviewOpen}
        currentIndex={index}
        onSelect={selectFromOverview}
        onClose={() => setOverviewOpen(false)}
      />
      <div className="desktop-notice">이 프레젠테이션은 Desktop 화면에 최적화되어 있습니다.</div>
    </main>
  );
}
