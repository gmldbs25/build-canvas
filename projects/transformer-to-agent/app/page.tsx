"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, RotateCcw } from "lucide-react";
import { appendix, pages } from "@/content/pages";
import { Scene } from "@/components/scene";

type Mode = "presentation" | "article";
const TOTAL_PAGES = pages.length;

function readLocation() {
  if (typeof window === "undefined") return { mode: "presentation" as Mode, index: 0 };
  const params = new URLSearchParams(window.location.search);
  const requested = params.get("page");
  const index = requested === "appendix" ? TOTAL_PAGES : Number(requested ?? "1") - 1;
  return {
    mode: params.get("mode") === "article" ? "article" as Mode : "presentation" as Mode,
    index: Math.max(0, Math.min(TOTAL_PAGES, Number.isFinite(index) ? index : 0)),
  };
}

export default function Home() {
  const [mode, setMode] = useState<Mode>("presentation");
  const [index, setIndex] = useState(0);
  const [run, setRun] = useState(0);
  const [phase, setPhase] = useState(0);
  const isAppendix = index === TOTAL_PAGES;
  const page = pages[index];

  const navigate = useCallback((nextIndex: number, nextMode: Mode = mode, replace = false) => {
    const safeIndex = Math.max(0, Math.min(TOTAL_PAGES, nextIndex));
    setIndex(safeIndex);
    setMode(nextMode);
    setRun((value) => value + 1);
    setPhase(0);
    const url = new URL(window.location.href);
    url.searchParams.set("mode", nextMode);
    url.searchParams.set("page", safeIndex === TOTAL_PAGES ? "appendix" : String(safeIndex + 1));
    window.history[replace ? "replaceState" : "pushState"]({}, "", url);
  }, [mode]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      const state = readLocation();
      setIndex(state.index);
      setMode(state.mode);
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    if (isAppendix) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const id = window.setTimeout(() => setPhase(4), 0);
      return () => window.clearTimeout(id);
    }
    const delays = [260, 700, 1120, 1600];
    const timers = delays.map((delay, offset) => window.setTimeout(() => setPhase(offset + 1), delay));
    return () => timers.forEach(window.clearTimeout);
  }, [index, run, isAppendix]);

  useEffect(() => {
    const onPopState = () => {
      const state = readLocation();
      setIndex(state.index);
      setMode(state.mode);
      setRun((value) => value + 1);
      setPhase(0);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.ctrlKey &&
        !event.metaKey &&
        !event.altKey &&
        !event.shiftKey &&
        (event.code === "KeyH" || event.key.toLowerCase() === "h")
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

      if ((event.target as HTMLElement)?.closest("button, a")) return;
      if (event.key === "ArrowLeft") navigate(index - 1);
      if (event.key === "ArrowRight") navigate(index + 1);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [index, navigate]);

  return (
    <main className={"site mode-" + mode}>
      <header className="topbar">
        <a className="brand" href="?mode=presentation&page=1">
          <span>WORK 03 · FROM NEXT TOKEN TO CODING AGENT</span>
          <strong>다음 토큰 예측에서 Coding Agent까지</strong>
        </a>
        <div className="mode-toggle" aria-label="표시 모드">
          <button aria-pressed={mode === "presentation"} onClick={() => navigate(index, "presentation")}>Presentation</button>
          <button aria-pressed={mode === "article"} onClick={() => navigate(index, "article")}>Article</button>
        </div>
      </header>

      <section className="page-shell" key={mode + "-" + index + "-" + run}>
        <header className="page-heading">
          <span>{isAppendix ? "APPENDIX" : "PAGE " + String(index + 1).padStart(2, "0")}</span>
          <h1>{isAppendix ? appendix.title : page.title}</h1>
          <p>{isAppendix ? appendix.presentation : page.presentation}</p>
        </header>

        {isAppendix ? (
          <div className="appendix">
            <figure>
              <img src="./agent-runtime-handoff-appendix.webp" alt="Model Output에서 Tool Request를 거쳐 Local Runtime으로 전달되는 삽화" />
            </figure>
            <article>
              <p>{appendix.article}</p>
              <p>모델은 Tool을 직접 실행하지 않는다. 구조화된 요청을 만들고, Runtime이 이를 검증한 뒤 파일·터미널·검증 도구에 연결한다.</p>
            </article>
          </div>
        ) : (
          <div className="content-grid">
            <div className="visual"><Scene page={page} phase={phase} /></div>
            {mode === "article" && (
              <article className="article">
                <span>ARTICLE · {String(index + 1).padStart(2, "0")}</span>
                {page.article.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                {page.id === "tool" && <pre>{'{\n  "tool": "read_file",\n  "arguments": { "path": "src/UserService.java" }\n}'}</pre>}
                {page.references && <aside><b>References</b>{page.references.map((reference) => <small key={reference}>{reference}</small>)}</aside>}
              </article>
            )}
          </div>
        )}

        {!isAppendix && <button className="replay" onClick={() => { setRun((value) => value + 1); setPhase(0); }}><RotateCcw /> 다시 재생</button>}
      </section>

      <nav className="navigation" aria-label="페이지 탐색">
        <button aria-label="이전 페이지" disabled={index === 0} onClick={() => navigate(index - 1)}><ArrowLeft /></button>
        <span>{isAppendix ? "APPENDIX" : "PAGE " + String(index + 1).padStart(2, "0") + " / 15"}</span>
        <button aria-label="다음 페이지" disabled={isAppendix} onClick={() => navigate(index + 1)}><ArrowRight /></button>
      </nav>
    </main>
  );
}
