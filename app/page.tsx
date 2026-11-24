// Keep the newest work first. Add future projects at the top with the next index.
const works = [
  {
    index: "07",
    title: "The Evolution of the Web",
    type: "WEB HISTORY · INTERACTIVE EXHIBIT",
    year: "2026.11",
    href: "./web-evolution/",
    inProgress: true,
  },
  {
    index: "06",
    title: "FAB FLOW",
    type: "SEMICONDUCTOR LOGISTICS · INTERACTIVE DOCUMENTARY",
    year: "2026.10",
    href: "./fab-flow-preview/",
  },
  {
    index: "05",
    title: "KotoMachi를 만들며",
    type: "DEVELOPMENT JOURNAL",
    year: "2026.10",
    href: "./kotomachi/",
  },
  {
    index: "04",
    title: "컴퓨터가 기억하는 방식",
    type: "NAND FLASH · INTERACTIVE EXPLAINER",
    year: "2026.09",
    href: "./nand-flash/",
  },
  {
    index: "03",
    title: "LLM to AGENT",
    type: "AI · INTERACTIVE EXPLAINER",
    year: "2026.08",
    href: "./transformer-to-agent/",
  },
  {
    index: "02",
    title: "World Models × ORCA",
    type: "AI · INTERACTIVE STORY",
    year: "2026.07",
    href: "./orca/",
  },
  {
    index: "01",
    title: "TEXAS TRACE",
    type: "TRAVEL · MAP EXPERIENCE",
    year: "2026.05",
    href: "./texas-trace/",
  },
];

export default function Home() {
  return (
    <main className="canvas-page">
      <section className="identity" aria-labelledby="site-title">
        <h1 id="site-title" className="wordmark">
          build <span className="cursor-mark" aria-hidden="true">_</span> canvas
        </h1>
        <p className="statement">
          <span>by heeyoon. ✦</span>
          {" · "}<a className="identity-link" href="https://github.com/gmldbs25" target="_blank" rel="noopener noreferrer">GitHub ↗</a>
          {" · "}<a className="identity-link" href="./elsewhere/" aria-label="애니메이션 감상 기록">elsewhere →</a>
        </p>
      </section>

      <section className="works" aria-labelledby="works-title">
        <h2 id="works-title">works</h2>
        <ol className="work-list">
          {works.map((work) => (
            <li key={work.index}>
              <a className="work-row" href={work.href}>
                <span className="work-index-group">
                  <span className="work-index">{work.index}</span>
                  {work.inProgress && (
                    <span className="work-status">
                      작업 중
                    </span>
                  )}
                </span>
                <strong>{work.title}</strong>
                <span className="work-type">{work.type}</span>
                <span className="work-year">{work.year}</span>
                <span className="work-arrow" aria-hidden="true">
                  →
                </span>
              </a>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
