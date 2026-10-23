import Link from 'next/link';
export default function NotFound() {
  return (
    <main style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', padding: 24 }}>
      <div style={{ textAlign: 'center' }}>
        <span className="eyebrow">A LITTLE DETOUR · 404</span>
        <h1 style={{ margin: '15px 0' }}>Let’s find your way back.</h1>
        <p style={{ marginBottom: 25 }}>Your next lightbulb moment is waiting at home.</p>
        <Link className="button primary" href="/">
          Back to Tally
        </Link>
      </div>
    </main>
  );
}
