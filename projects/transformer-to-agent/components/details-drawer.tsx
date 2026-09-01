"use client";

import { useEffect, useLayoutEffect, useRef, type RefObject } from "react";
import { X } from "lucide-react";
import type { SceneDefinition } from "@/content/pages";

type DetailsDrawerProps = {
  open: boolean;
  scene: SceneDefinition;
  scrollRef: RefObject<HTMLDivElement | null>;
  onClose: () => void;
};

export function DetailsDrawer({ open, scene, scrollRef, onClose }: DetailsDrawerProps) {
  const drawerRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    if (open && scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [open, scene.id, scrollRef]);

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
