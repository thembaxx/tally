import Link from 'next/link';
import { GuideFooter, GuideHeader } from '@/components/guide-shell';
import { lessons } from '@/lib/learning';
import { guideTitle, pageMetadata } from '@/lib/guides';
import { absoluteUrl, jsonLd } from '@/lib/site';

export const metadata = pageMetadata(
  'Learn accounting: free guides and interactive lessons',
  'Explore 15 short accounting guides with everyday examples. Learn the accounting equation, debits and credits, cash flow, journal entries and more.',
  '/learn',
);

export default function LearningShelf() {
  const available = lessons.filter((lesson) => !lesson.locked);
  return (
    <div className="guide-shell">
      <a className="skip-link" href="#guide-main">
        Skip to accounting guides
      </a>
      <GuideHeader />
      <main id="guide-main">
        <section className="shelf-hero">
          <div>
            <span className="eyebrow">ACCOUNTING GUIDES · {available.length} TOPICS</span>
            <h1>
              Accounting,
              <br />
              <em>with examples.</em>
            </h1>
            <p>
              Learn accounting through South African examples in rand. Read an idea, try an example,
              then bring it to life in Tally.
            </p>
            <Link className="button primary" href="/?lesson=equation">
              Start with the accounting equation
            </Link>
            <span className="guide-quiet">Free lessons. No account needed.</span>
          </div>
          <div className="shelf-brand-art">
            <img
              src="/brand-mark.webp"
              alt="Tally’s colourful folded t symbol"
              width={240}
              height={240}
            />
            <span>Make accounting click.</span>
          </div>
        </section>
        <div className="shelf-intro">
          <span className="eyebrow">YOUR PACE, YOUR PATH</span>
          <h2>A place for every “wait, why?”</h2>
          <p>
            Start with the basics or follow a question. The deeper chapters introduce more advanced
            ideas through simple, focused examples.
          </p>
        </div>
        {(['Foundations', 'Next level', 'Going deeper'] as const).map((level, index) => (
          <section className="shelf-group" key={level} aria-labelledby={`level-${index}`}>
            <div className="shelf-group-heading">
              <span className="shelf-number mono">0{index + 1}</span>
              <div>
                <h2 id={`level-${index}`}>{level}</h2>
                <p>
                  {
                    [
                      'Meet the ideas everything else builds on.',
                      'Connect the dots. Follow the money.',
                      'Ask better questions about the numbers.',
                    ][index]
                  }
                </p>
              </div>
            </div>
            <div className="guide-grid">
              {available
                .filter((lesson) => lesson.level === level)
                .map((lesson) => (
                  <Link
                    className={`guide-card ${lesson.color}`}
                    href={`/learn/${lesson.id}`}
                    key={lesson.id}
                  >
                    <span className="guide-card-top">
                      <span className="mono">{lesson.minutes} MIN</span>
                      <span aria-hidden="true">↗</span>
                    </span>
                    <span className="eyebrow">{lesson.title}</span>
                    <h3>{guideTitle(lesson)}</h3>
                    <p>{lesson.subtitle}</p>
                    <span className="guide-card-cta">
                      Explore the idea <span aria-hidden="true">→</span>
                    </span>
                  </Link>
                ))}
            </div>
          </section>
        ))}
        <section className="guide-method">
          <span className="eyebrow">SMALL EFFORT. LASTING CONNECTIONS.</span>
          <h2>Read it. Try it. Come back to it.</h2>
          <p>
            Every guide pairs a plain-language idea with a worked example and a quick check. In the
            app, you can sort, type, build and recall with explanatory feedback, daily challenges
            and spaced review.
          </p>
          <Link className="button primary" href="/?tab=practice">
            Find your way to practice
          </Link>
        </section>
      </main>
      <GuideFooter />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd({
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            '@id': absoluteUrl('/learn#page'),
            url: absoluteUrl('/learn'),
            name: 'Learn accounting: free guides and interactive lessons',
            description:
              'Short, self-paced accounting guides with everyday examples and interactive practice.',
            isPartOf: { '@id': absoluteUrl('/#website') },
            mainEntity: {
              '@type': 'ItemList',
              numberOfItems: available.length,
              itemListElement: available.map((lesson, index) => ({
                '@type': 'ListItem',
                position: index + 1,
                name: guideTitle(lesson),
                url: absoluteUrl(`/learn/${lesson.id}`),
              })),
            },
          }),
        }}
      />
    </div>
  );
}
