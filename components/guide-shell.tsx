import Link from 'next/link';

export function GuideHeader() {
  return (
    <header className="guide-header">
      <Link className="brand" href="/" aria-label="Tally home">
        <img className="brand-mark" src="/brand-mark.webp" alt="" width={40} height={40} />
        <span>
          tally<span className="brand-dot">.</span>
        </span>
      </Link>
      <nav aria-label="Guide navigation">
        <Link href="/learn">The learning shelf</Link>
        <Link className="button primary" href="/?tab=learn">
          Open Tally
        </Link>
      </nav>
    </header>
  );
}

export function GuideFooter() {
  return (
    <footer className="guide-footer">
      <p>
        <strong>Tally.</strong> Make accounting click.
      </p>
      <p>Free to explore. No account needed. At your pace.</p>
      <div>
        <Link href="/">Your learning space</Link>
        <Link href="/learn">All accounting guides</Link>
        <a href="/llms.txt">LLM reference</a>
      </div>
      <small>Made for curious minds. From foundations to deeper understanding.</small>
    </footer>
  );
}
