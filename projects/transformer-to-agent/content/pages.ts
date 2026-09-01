import { detailsArticle } from "@/content/details";
import type { DetailBlock } from "@/content/details-parser";

export type SceneTone = "light" | "dark";

export type SceneDefinition = {
  id: string;
  number: string;
  title: string;
  act: number | null;
  actTitle?: string;
  actPosition?: number;
  actSize?: number;
  actQuestion?: string;
  tone: SceneTone;
  hideCaption?: boolean;
  details: DetailBlock[];
};

type SceneMeta = Omit<SceneDefinition, "title" | "details">;

const sceneMetas: SceneMeta[] = [
  { id: "intro", number: "00", act: null, tone: "light" },
  {
    id: "incident",
    number: "01",
    act: 1,
    actTitle: "MODEL",
    actPosition: 1,
    actSize: 4,
    actQuestion: "Model 자체는 실제로 무엇을 하는가?",
    tone: "dark",
  },
  { id: "focus-llm", number: "02", act: 1, actTitle: "MODEL", actPosition: 2, actSize: 4, tone: "light" },
  { id: "next-token", number: "03", act: 1, actTitle: "MODEL", actPosition: 3, actSize: 4, tone: "light" },
  { id: "generation", number: "04", act: 1, actTitle: "MODEL", actPosition: 4, actSize: 4, tone: "light" },
  {
    id: "context-growth",
    number: "05",
    act: 2,
    actTitle: "CONTEXT",
    actPosition: 1,
    actSize: 3,
    actQuestion: "Model은 무엇을 보고 판단하는가?",
    tone: "dark",
  },
  { id: "evidence-context", number: "06", act: 2, actTitle: "CONTEXT", actPosition: 2, actSize: 3, tone: "light" },
  { id: "access-context", number: "07", act: 2, actTitle: "CONTEXT", actPosition: 3, actSize: 3, tone: "dark" },
  {
    id: "model-requests",
    number: "08",
    act: 3,
    actTitle: "MODEL ↔ ENVIRONMENT",
    actPosition: 1,
    actSize: 3,
    actQuestion: "누가 요청하고, 누가 실제로 행동하는가?",
    tone: "dark",
  },
  { id: "execution-acts", number: "09", act: 3, actTitle: "MODEL ↔ ENVIRONMENT", actPosition: 2, actSize: 3, tone: "dark" },
  { id: "result-context", number: "10", act: 3, actTitle: "MODEL ↔ ENVIRONMENT", actPosition: 3, actSize: 3, tone: "light" },
  {
    id: "one-pass",
    number: "11",
    act: 4,
    actTitle: "LOOP",
    actPosition: 1,
    actSize: 5,
    actQuestion: "한 번의 출력은 어떻게 반복 작업이 되는가?",
    tone: "dark",
  },
  { id: "agent-loop", number: "12", act: 4, actTitle: "LOOP", actPosition: 2, actSize: 5, tone: "dark" },
  { id: "npe-run", number: "13", act: 4, actTitle: "LOOP", actPosition: 3, actSize: 5, tone: "dark" },
  { id: "patch-revise", number: "14", act: 4, actTitle: "LOOP", actPosition: 4, actSize: 5, tone: "dark" },
  { id: "task-complete", number: "15", act: 4, actTitle: "LOOP", actPosition: 5, actSize: 5, tone: "dark" },
  {
    id: "agent-system",
    number: "16",
    act: 5,
    actTitle: "AGENT",
    actPosition: 1,
    actSize: 2,
    actQuestion: "Model 주변의 책임은 어떻게 Agent가 되는가?",
    tone: "dark",
  },
  { id: "conclusion", number: "19", act: 5, actTitle: "AGENT", actPosition: 2, actSize: 2, tone: "dark" },
  { id: "appendix", number: "A1", act: null, tone: "dark", hideCaption: true },
];

export const scenes: SceneDefinition[] = sceneMetas.map((meta) => {
  const articleScene = detailsArticle.byNumber[meta.number];
  if (!articleScene) {
    throw new Error(`Details v4 is missing Scene ${meta.number}.`);
  }
  return { ...meta, title: articleScene.title, details: articleScene.blocks };
});

if (scenes.map((scene) => scene.number).join(",") !== detailsArticle.order.join(",")) {
  throw new Error("Presentation sequence and Details v4 sequence differ.");
}

export const TOTAL_SCENES = scenes.length;
