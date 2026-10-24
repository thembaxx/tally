import Link from 'next/link';
export default function NotFound() {
  return (
    <main style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', padding: 24 }}>
      <div style={{ textAlign: 'center' }}>
        <span className="eyebrow">404</span>
        <h1 style={{ margin: '15px 0' }}>Page not found</h1>
        <p style={{ marginBottom: 25 }}>Open Tally to continue learning or choose a lesson.</p>
        <Link className="button primary" href="/">
          Back to Tally
        </Link>
      </div>
    </main>
  );
}
