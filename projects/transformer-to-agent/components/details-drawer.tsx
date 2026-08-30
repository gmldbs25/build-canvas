import { X } from "lucide-react";
import type { SceneDefinition } from "@/content/pages";

type DetailsDrawerProps = {
  open: boolean;
  scene: SceneDefinition;
  onClose: () => void;
};

export function DetailsDrawer({ open, scene, onClose }: DetailsDrawerProps) {
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

        <div className="details-scroll" tabIndex={open ? 0 : -1}>
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
