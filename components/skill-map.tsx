import { ArrowRightIcon, PathIcon } from '@phosphor-icons/react';
import { lessons, type Progress } from '@/lib/learning';
import { recallEvidence, skillStage, skillStages } from '@/lib/skills';
import type { Session } from '@/lib/session';
import { dateLabel } from '@/lib/south-africa';

export function SkillMap({
  progress,
  today,
  onLaunch,
}: {
  progress: Progress;
  today: string;
  onLaunch: (session: Session) => void;
}) {
  const skills = lessons
    .filter((lesson) => !lesson.locked)
    .map((lesson) => ({
      lesson,
      review: progress.reviews[lesson.id],
      explored: progress.completed.includes(lesson.id) || !!progress.reviews[lesson.id],
      stage: skillStage(progress.reviews[lesson.id], progress.completed.includes(lesson.id)),
    }));
  return (
    <section className="skill-map" aria-labelledby="skill-map-title">
      <div className="skill-map-intro">
        <span className="skill-map-icon">
          <PathIcon size={28} weight="duotone" />
        </span>
        <div>
          <h2 id="skill-map-title">Your skill map</h2>
          <p>Check your practice history and choose a topic to review.</p>
        </div>
      </div>
      <dl className="skill-legend">
        {skillStages.map((stage) => (
          <div key={stage.id}>
            <dt>{stage.label}</dt>
            <dd className="mono">{skills.filter((skill) => skill.stage.id === stage.id).length}</dd>
            <dd>{stage.description}</dd>
          </div>
        ))}
      </dl>
      <p className="skill-map-note">
        Stages reflect your recorded practice, hints, retries, and recall on separate days. They can
        change with practice. A completed lesson or XP alone doesn’t make a skill steady.
      </p>
      {['Foundations', 'Next level', 'Going deeper'].map((level) => (
        <section className="skill-group" key={level} aria-label={level}>
          <h3>{level}</h3>
          <ul className="skill-grid">
            {skills
              .filter((skill) => skill.lesson.level === level)
              .map(({ lesson, review, explored, stage }) => (
                <li key={lesson.id}>
                  <article className="skill-card" aria-label={lesson.title}>
                    <div className="skill-card-heading">
                      <h4>{lesson.title}</h4>
                      <span className="skill-status" data-stage={stage.id}>
                        {stage.label}
                      </span>
                    </div>
                    <div className="skill-steps" aria-hidden="true">
                      {skillStages.slice(1).map((step, index) => (
                        <span
                          key={step.id}
                          className={index < skillStages.indexOf(stage) ? 'filled' : ''}
                        />
                      ))}
                    </div>
                    <p>{recallEvidence(review, explored)}</p>
                    {!!review?.total && (
                      <p className="skill-history">
                        {review.firstTry} of {review.total} activities answered independently
                        overall.
                      </p>
                    )}
                    {review && (
                      <p className="skill-due">
                        {review.due <= today ? 'Review due' : 'Next review'} ·{' '}
                        <time dateTime={review.due}>{dateLabel(review.due)}</time>
                      </p>
                    )}
                    <button
                      className="text-button"
                      aria-label={`${explored ? 'Review' : 'Start'} ${lesson.title}`}
                      onClick={() =>
                        onLaunch(explored ? { kind: 'review', ids: [lesson.id] } : lesson)
                      }
                    >
                      {explored ? 'Try a short review' : 'Start the lesson'} <ArrowRightIcon />
                    </button>
                  </article>
                </li>
              ))}
          </ul>
        </section>
      ))}
    </section>
  );
}
