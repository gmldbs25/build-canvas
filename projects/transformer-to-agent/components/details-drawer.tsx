"use client";

import { Fragment, useEffect, useLayoutEffect, useRef, type ReactNode, type RefObject } from "react";
import { X } from "lucide-react";
import type { SceneDefinition } from "@/content/pages";

type DetailsDrawerProps = {
  open: boolean;
  scene: SceneDefinition;
  scrollRef: RefObject<HTMLDivElement | null>;
  onClose: () => void;
};

function inlineMarkup(value: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const pattern = /(\*\*.+?\*\*|`[^`]+`)/g;
  let cursor = 0;

  for (const match of value.matchAll(pattern)) {
    const index = match.index ?? 0;
    if (index > cursor) parts.push(value.slice(cursor, index));
    const token = match[0];
    if (token.startsWith("**")) {
      parts.push(<strong key={`${index}-strong`}>{token.slice(2, -2)}</strong>);
    } else {
      parts.push(<code key={`${index}-code`}>{token.slice(1, -1)}</code>);
    }
    cursor = index + token.length;
  }

  if (cursor < value.length) parts.push(value.slice(cursor));
  return parts;
}

function InlineMarkup({ value }: { value: string }) {
  return <>{inlineMarkup(value)}</>;
}

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
          <article className="details-article">
            {scene.details.map((block, blockIndex) => {
              const key = `${scene.id}-${blockIndex}`;
              if (block.type === "heading") {
                return block.level === 2
                  ? <h3 key={key}><InlineMarkup value={block.text} /></h3>
                  : <h4 key={key}><InlineMarkup value={block.text} /></h4>;
              }
              if (block.type === "paragraph") {
                return <p key={key}><InlineMarkup value={block.text} /></p>;
              }
              if (block.type === "quote") {
                return <blockquote key={key}><InlineMarkup value={block.text} /></blockquote>;
              }
              if (block.type === "code") {
                return (
                  <pre data-language={block.language || undefined} key={key}>
                    <code>{block.value}</code>
                  </pre>
                );
              }
              const List = block.ordered ? "ol" : "ul";
              return (
                <List key={key}>
                  {block.items.map((item, itemIndex) => (
                    <Fragment key={`${key}-${itemIndex}`}>
                      <li><InlineMarkup value={item} /></li>
                    </Fragment>
                  ))}
                </List>
              );
            })}
          </article>
        </div>
      </aside>
    </>
  );
}
