"use client";

import { useEffect, useLayoutEffect, useRef, type KeyboardEvent } from "react";
import { X } from "lucide-react";
import type { SceneDefinition } from "@/content/pages";

type DetailsDrawerProps = {
  open: boolean;
  scene: SceneDefinition;
  onClose: () => void;
};

function handleVerticalScroll(event: KeyboardEvent<HTMLDivElement>) {
  const target = event.target as HTMLElement;
  if (target.closest("input, textarea, [contenteditable]:not([contenteditable=\"false\"]), [role=\"textbox\"], [data-code-editor]")) {
    return;
  }

  const pageDistance = Math.max(1, Math.round(event.currentTarget.clientHeight * 0.85));
  const distance = {
    ArrowDown: 48,
    ArrowUp: -48,
    PageDown: pageDistance,
    PageUp: -pageDistance,
  }[event.key];

  if (distance === undefined) return;
  event.preventDefault();
  event.currentTarget.scrollTop += distance;
}

export function DetailsDrawer({ open, scene, onClose }: DetailsDrawerProps) {
  const drawerRef = useRef<HTMLElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (open && scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [open, scene.id]);

  useEffect(() => {
    if (!open && drawerRef.current?.contains(document.activeElement)) {
      (document.activeElement as HTMLElement).blur();
    }
  }, [open]);

  return (
    <>
      <button
        className="details-backdrop"
        data-open={open}
        aria-label="Details 닫기"
        tabIndex={open ? 0 : -1}
        onClick={onClose}
      />
      <aside
        ref={drawerRef}
        id="scene-details"
        className="details-drawer"
        data-open={open}
        aria-hidden={!open}
        aria-label={`${scene.title} 기술 설명`}
      >
        <header className="details-header">
          <div>
            <span>DETAILS · {scene.number}</span>
            <h2>{scene.title}</h2>
          </div>
          <button aria-label="Details 닫기" onClick={onClose} tabIndex={open ? 0 : -1}>
            <X aria-hidden="true" />
          </button>
        </header>

        <div
          ref={scrollRef}
          className="details-scroll"
          tabIndex={open ? 0 : -1}
          onKeyDown={handleVerticalScroll}
        >
          {scene.details?.map((section, sectionIndex) => (
            <section className="details-section" key={`${section.title}-${sectionIndex}`}>
              <h3>{section.title}</h3>
              {section.paragraphs?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              {section.bullets && (
                <ul>
                  {section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
                </ul>
              )}
              {section.code?.map((code, index) => <pre key={`${section.title}-${index}`}><code>{code}</code></pre>)}
            </section>
          ))}

          {scene.references && (
            <section className="details-section details-references">
              <h3>References</h3>
              {scene.references.map((reference) => (
                <a href={reference.url} target="_blank" rel="noreferrer" key={reference.url}>
                  {reference.label}
                </a>
              ))}
            </section>
          )}
        </div>
      </aside>
    </>
  );
}
