export default function Loading() {
  return (
    <div className="app-loading" aria-label="Getting your learning space ready">
      <img src="/brand-mark.webp" alt="" width={56} height={56} />
      <span>
        tally<span style={{ color: 'var(--brand)' }}>.</span>
      </span>
      <p>A little curiosity goes a long way.</p>
      <style>{`.app-loading{min-height:100dvh;background:var(--bg);display:flex;flex-direction:column;align-items:center;justify-content:center}.app-loading>span{font-family:Outfit,sans-serif;font-size:44px;letter-spacing:-2px}.app-loading p{font-size:12px;margin-top:15px}`}</style>
    </div>
  );
}
