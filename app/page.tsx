// Keep the newest work first. Add future projects at the top with the next index.
const works = [
  {
    index: "03",
    title: "FROM TRANSFORMER TO AGENT SYSTEMS",
    type: "AI · INTERACTIVE EXPLAINER",
    year: "2026",
    href: "./transformer-to-agent/",
  },
  {
    index: "02",
    title: "ORCA",
    type: "AI · INTERACTIVE STORY",
    year: "2026",
    href: "./orca/",
  },
  {
    index: "01",
    title: "TEXAS TRACE",
    type: "TRAVEL · MAP EXPERIENCE",
    year: "2026",
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
          <span>생각, 그림,</span>
          <span>개발, 기록</span>
        </p>
      </section>

      <section className="works" aria-labelledby="works-title">
        <h2 id="works-title">works</h2>
        <ol className="work-list">
          {works.map((work) => (
            <li key={work.index}>
              <a className="work-row" href={work.href}>
                <span className="work-index">{work.index}</span>
                <strong>{work.title}</strong>
                <span className="work-type">{work.type}</span>
                <span className="work-year">{work.year}</span>
                <span className="work-arrow" aria-hidden="true">
                  ↗
                </span>
              </a>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
