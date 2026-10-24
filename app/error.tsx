'use client';
export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', padding: 24 }}>
      <div style={{ maxWidth: 400, textAlign: 'center' }}>
        <h1>Tally couldn’t load.</h1>
        <p style={{ margin: '20px 0' }}>
          Your saved progress is still on this device. Let’s try that again.
        </p>
        <button className="button primary" onClick={reset}>
          Try again
        </button>
      </div>
    </main>
  );
}
