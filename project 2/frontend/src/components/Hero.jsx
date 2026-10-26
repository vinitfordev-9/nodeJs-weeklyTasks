export default function Hero() {
  return (
    <section className="hero">
      <div>
        <div className="eyebrow">
          <span className="status-dot" />
          BIG IDEAS. BETTER OPPORTUNITIES.
        </div>
        <h1>
          Find your people.
          <br />
          Do your <em>best work.</em>
        </h1>
        <p>
          Discover thoughtful teams, meaningful work, and a role that feels like
          you.
        </p>
      </div>
      <div className="hero-art" aria-hidden="true">
        <div className="art-circle" />
        <div className="art-line" />
        <div className="art-card">
          <span className="mini-label">YOUR NEXT CHAPTER</span>
          <strong>Looks good on you.</strong>
          <div className="art-footer">
            <span>A little possibility.</span>
            <span>↗</span>
          </div>
        </div>
        <span className="art-star">✳</span>
        <span className="art-tag">Make your next move ↗</span>
      </div>
    </section>
  );
}
