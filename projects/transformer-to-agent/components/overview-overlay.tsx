"use client";

import { X } from "lucide-react";
import { scenes, TOTAL_SCENES, type SceneDefinition } from "@/content/pages";

type OverviewOverlayProps = {
  open: boolean;
  currentIndex: number;
  onSelect: (index: number) => void;
  onClose: () => void;
};

type OverviewGroup = {
  key: string;
  label: string;
  question?: string;
  entries: { scene: SceneDefinition; index: number }[];
};

function buildGroups(): OverviewGroup[] {
  const groups: OverviewGroup[] = [];

  scenes.forEach((scene, index) => {
    const key = scene.act === null ? `standalone-${scene.id}` : `act-${scene.act}`;
    const last = groups[groups.length - 1];

    if (last?.key === key) {
      last.entries.push({ scene, index });
      return;
    }

    groups.push({
      key,
      label: scene.act === null ? (index === 0 ? "INTRO" : "APPENDIX") : `ACT ${scene.act} · ${scene.actTitle}`,
      question: scene.actQuestion,
      entries: [{ scene, index }],
    });
  });

  return groups;
}

const groups = buildGroups();

export function OverviewOverlay({ open, currentIndex, onSelect, onClose }: OverviewOverlayProps) {
  return (
    <div className="overview-overlay" data-open={open} aria-hidden={!open}>
      <header>
        <div>
          <span>OVERVIEW · {TOTAL_SCENES} SCENES</span>
          <h2>LLM to AGENT</h2>
        </div>
        <button aria-label="목차 닫기" onClick={onClose} tabIndex={open ? 0 : -1}>
          <X aria-hidden="true" />
        </button>
      </header>

      <div className="overview-groups">
        {groups.map((group) => (
          <section key={group.key}>
            <h3>{group.label}</h3>
            {group.question && <p>{group.question}</p>}
            <ol>
              {group.entries.map(({ scene, index }) => (
                <li key={scene.id}>
                  <button
                    aria-current={index === currentIndex ? "true" : undefined}
                    tabIndex={open ? 0 : -1}
                    onClick={() => onSelect(index)}
                  >
                    <b>{scene.number}</b>
                    <span>{scene.title}</span>
                  </button>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>
    </div>
  );
}
