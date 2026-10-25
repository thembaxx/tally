'use client';
import { lessons } from '@/lib/learning';
import { projects } from '@/lib/projects';
import type { Experiences } from '@/lib/experiences';
export function ReflectionNotebook({ coaching }: { coaching: Experiences['coaching'] }) {
  const notes = Object.entries(coaching).filter(([, value]) => value.note.trim());
  if (!notes.length) return null;
  return (
    <section className="reflection-notebook" aria-label="My thinking">
      <div className="section-heading">
        <div>
          <span className="eyebrow">IN YOUR OWN WORDS</span>
          <h2>My thinking</h2>
          <p>Your private reflections, ready to revisit.</p>
        </div>
      </div>
      {notes.map(([id, evidence]) => (
        <details className="coach-tools" key={id}>
          <summary>
            {lessons.find((l) => l.id === id)?.title ||
              projects.find((p) => p.id === id)?.name ||
              'Accounting reflection'}
          </summary>
          <p className="reflection-note">{evidence.note}</p>
        </details>
      ))}
    </section>
  );
}
