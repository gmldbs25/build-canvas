type ArtworkProps = {
  variant?: "intro" | "appendix";
};

export function AgentArtwork({ variant = "intro" }: ArtworkProps) {
  const src = variant === "appendix"
    ? "./agent-runtime-handoff-full.png"
    : "./agent-runtime-handoff.webp";

  return (
    <figure className={`agent-artwork agent-artwork-${variant}`}>
      {/* A repository-owned editorial asset is used directly so the static Pages export stays self-contained. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt="Model의 신호가 시스템 경계를 지나 개발 환경과 연결되고 결과가 돌아오는 개념 삽화"
      />
      <figcaption className="sr-only">
        Model, Context, Execution, Environment와 Feedback Loop를 상징하는 editorial conceptual artwork
      </figcaption>
    </figure>
  );
}
