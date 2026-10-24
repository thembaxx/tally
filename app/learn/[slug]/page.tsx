import Link from 'next/link';
import { notFound } from 'next/navigation';
import { GuideFooter, GuideHeader } from '@/components/guide-shell';
import { lessons } from '@/lib/learning';
import { guideTitle, pageMetadata } from '@/lib/guides';
import { learningContext } from '@/lib/south-africa';
import { absoluteUrl, jsonLd } from '@/lib/site';

export const dynamicParams = false;
export function generateStaticParams() {
  return lessons.filter((lesson) => !lesson.locked).map((lesson) => ({ slug: lesson.id }));
}
type Props = { params: Promise<{ slug: string }> };
function findLesson(slug: string) {
  const lesson = lessons.find((item) => item.id === slug && !item.locked);
  if (!lesson) notFound();
  return lesson;
}
export async function generateMetadata({ params }: Props) {
  const lesson = findLesson((await params).slug);
  return pageMetadata(
    guideTitle(lesson),
    `${lesson.subtitle} ${lesson.concept}`.slice(0, 157).replace(/\s+\S*$/, '') + '…',
    `/learn/${lesson.id}`,
  );
}

export default async function LessonGuide({ params }: Props) {
  const lesson = findLesson((await params).slug);
  const title = guideTitle(lesson);
  const related = lessons
    .filter((item) => item.id !== lesson.id && !item.locked && item.level === lesson.level)
    .slice(0, 3);
  return (
    <div className="guide-shell">
      <a className="skip-link" href="#guide-main">
        Skip to lesson guide
      </a>
      <GuideHeader />
      <main id="guide-main">
        <nav className="guide-breadcrumb" aria-label="Breadcrumb">
          <Link href="/">Tally</Link>
          <span aria-hidden="true">/</span>
          <Link href="/learn">Learn accounting</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{lesson.title}</span>
        </nav>
        <article className="lesson-guide">
          <header className={`guide-title-block ${lesson.color}`}>
            <span className="eyebrow">
              {lesson.level.toUpperCase()} <span aria-hidden="true">·</span>{' '}
              <span className="mono">{lesson.minutes} MIN</span>
            </span>
            <h1>{title}</h1>
            <p>{lesson.subtitle}</p>
            <p className="guide-caption">{learningContext}</p>
            <Link className="button primary" href={`/?lesson=${lesson.id}`}>
              Try the interactive lesson <span aria-hidden="true">→</span>
            </Link>
          </header>
          <div className="guide-reading">
            <section>
              <span className="eyebrow">01 · THE IDEA</span>
              <h2>Let’s make it simple.</h2>
              <p>{lesson.concept}</p>
            </section>
            <section className="guide-example">
              <span className="eyebrow">02 · IN EVERYDAY LIFE</span>
              <h2>Picture this.</h2>
              <p>{lesson.example}</p>
            </section>
            <aside className="guide-tip">
              <img src="/brand-mark.webp" alt="" width={36} height={36} />
              <p>
                <strong>Key point</strong>
                {lesson.tip}
              </p>
            </aside>
            <section>
              <span className="eyebrow">03 · YOUR TURN</span>
              <h2>Check your understanding</h2>
              <p>{lesson.entry.prompt}</p>
              <details>
                <summary>Think it through, then reveal the explanation</summary>
                <p>{lesson.entry.explanation}</p>
              </details>
            </section>
            <section>
              <span className="eyebrow">04 · CONNECT THE STEPS</span>
              <h2>Build the bigger picture.</h2>
              <ol>
                {lesson.order.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
              <p className="guide-caption">{lesson.orderTip}</p>
            </section>
            <section className="guide-practice-callout">
              <h2>Now make it move.</h2>
              <p>
                Bring this idea to life with interactive practice, a 3D illustration and tips along
                the way. Your progress stays on your device.
              </p>
              <Link className="button primary" href={`/?lesson=${lesson.id}`}>
                Practice {lesson.title} <span aria-hidden="true">→</span>
              </Link>
            </section>
          </div>
        </article>
        <section className="guide-related">
          <span className="eyebrow">FOLLOW YOUR CURIOSITY</span>
          <h2>Related lessons</h2>
          <div className="guide-grid">
            {related.map((item) => (
              <Link key={item.id} className={`guide-card ${item.color}`} href={`/learn/${item.id}`}>
                <span className="mono">{item.minutes} MIN</span>
                <h3>{guideTitle(item)}</h3>
                <p>{item.subtitle}</p>
                <span className="guide-card-cta">
                  Explore the idea <span aria-hidden="true">→</span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      </main>
      <GuideFooter />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd({
            '@context': 'https://schema.org',
            '@graph': [
              {
                '@type': 'LearningResource',
                '@id': absoluteUrl(`/learn/${lesson.id}#resource`),
                url: absoluteUrl(`/learn/${lesson.id}`),
                name: title,
                description: lesson.concept,
                inLanguage: 'en-ZA',
                learningResourceType: 'Lesson',
                educationalUse: ['Instruction', 'Practice'],
                educationalLevel:
                  lesson.level === 'Foundations'
                    ? 'Beginner'
                    : lesson.level === 'Next level'
                      ? 'Intermediate'
                      : 'Introduction to advanced concepts',
                timeRequired: `PT${lesson.minutes}M`,
                isAccessibleForFree: true,
                teaches: lesson.concept,
                provider: { '@id': absoluteUrl('/#organization') },
                isPartOf: { '@id': absoluteUrl('/learn#page') },
              },
              {
                '@type': 'BreadcrumbList',
                itemListElement: [
                  { '@type': 'ListItem', position: 1, name: 'Tally', item: absoluteUrl('/') },
                  {
                    '@type': 'ListItem',
                    position: 2,
                    name: 'Learn accounting',
                    item: absoluteUrl('/learn'),
                  },
                  {
                    '@type': 'ListItem',
                    position: 3,
                    name: title,
                    item: absoluteUrl(`/learn/${lesson.id}`),
                  },
                ],
              },
            ],
          }),
        }}
      />
    </div>
  );
}
