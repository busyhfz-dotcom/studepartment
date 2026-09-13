const pillars = [
  {
    title: "Discover",
    description: "Find researchers, laboratories, institutions, grants, and positions through scientific context rather than keyword noise.",
  },
  {
    title: "Understand",
    description: "See why an opportunity or person is relevant through transparent, explainable matching.",
  },
  {
    title: "Connect",
    description: "Use controlled scientific introductions instead of unrestricted cold messaging.",
  },
];

export default function HomePage() {
  return (
    <main className="shell">
      <section className="hero">
        <span className="eyebrow">Medical Research Intelligence</span>
        <h1>Find the right scientific people and opportunities without the noise.</h1>
        <p className="lede">
          Studepartment is a privacy-first intelligence layer for medical and biomedical research discovery, matching, and trusted introductions.
        </p>
        <div className="actions">
          <a className="primary" href="/onboarding">Build scientific identity</a>
          <a className="secondary" href="/discover">Try discovery</a>
          <a className="secondary" href="/profile">View profile</a>
        </div>
      </section>

      <section className="grid" id="principles">
        {pillars.map((pillar, index) => (
          <article className="card" key={pillar.title}>
            <span className="cardIndex">0{index + 1}</span>
            <h2>{pillar.title}</h2>
            <p>{pillar.description}</p>
          </article>
        ))}
      </section>

      <section className="statement" id="architecture">
        <div>
          <span className="eyebrow">Product principle</span>
          <h2>Value over engagement.</h2>
        </div>
        <p>
          No follower races, public rankings, or endless feed. The system is optimized for relevant discovery, trusted identity, and meaningful scientific outcomes.
        </p>
      </section>
    </main>
  );
}
