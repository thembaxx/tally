'use client';
import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowRightIcon, SparkleIcon, CheckIcon, PathIcon } from '@phosphor-icons/react';
import { startingQuestions, personalChallenge, type TutorProfile } from '@/lib/personalisation';
import { lessons, type Progress } from '@/lib/learning';
import { Blob } from './brand';

export function TutorPreferences({
  progress: p,
  update,
  day,
  onClose,
}: {
  progress: Progress;
  update: (change: (old: TutorProfile) => TutorProfile) => void;
  day: string;
  onClose: () => void;
}) {
  const [checking, setChecking] = useState(false);
  const missing = startingQuestions.findIndex((q) => !p.tutor.startingPoint.answers[q.id]);
  const [step, setStep] = useState(missing < 0 ? 3 : missing);
  const [answer, setAnswer] = useState<string | null>(null);
  const still = useReducedMotion();
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (checking) heading.current?.focus();
  }, [checking, step]);
  const q = startingQuestions[step];
  function choose(value: string) {
    if (!q || answer) return;
    setAnswer(value);
    update((old) => {
      const answers = {
        ...old.startingPoint.answers,
        [q.id]: value === q.answer ? ('ready' as const) : ('support' as const),
      };
      return {
        ...old,
        startingPoint: {
          answers,
          ...(startingQuestions.every((item) => answers[item.id]) ? { day } : {}),
        },
      };
    });
  }
  if (checking)
    return (
      <div className="tutor-fit">
        {q ? (
          <motion.div
            key={q.id}
            initial={still ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className="eyebrow">A STARTING POINT, AT YOUR PACE</span>
            <div role="img" className="fit-step-track" aria-label={`Question ${step + 1} of 3`}>
              {startingQuestions.map((item, index) => (
                <span key={item.id} className={index <= step ? 'filled' : ''} />
              ))}
              <small className="mono">0{step + 1} / 03</small>
            </div>
            <h2 ref={heading} tabIndex={-1}>
              {q.title}
            </h2>
            <p className="fit-question">{q.prompt}</p>
            <div className="fit-choices" role="group" aria-label="Choose your answer">
              {q.choices.map((choice) => (
                <button
                  type="button"
                  key={choice}
                  disabled={!!answer}
                  aria-pressed={answer === choice}
                  data-tally-sound="select"
                  onClick={() => choose(choice)}
                >
                  {choice}
                  <ArrowRightIcon />
                </button>
              ))}
            </div>
            {!answer && (
              <button type="button" className="text-button" onClick={() => choose('not-sure')}>
                Not sure yet — show me
              </button>
            )}
            {answer && (
              <div className="fit-feedback" role="status">
                <Blob small />
                <div>
                  <strong>
                    {answer === q.answer
                      ? 'You made the connection.'
                      : 'A good place to build from.'}
                  </strong>
                  <p>{q.explanation}</p>
                </div>
              </div>
            )}
            {answer && (
              <button
                type="button"
                className="button primary full"
                onClick={() => {
                  setStep(step + 1);
                  setAnswer(null);
                }}
              >
                {step === 2 ? 'See my starting point' : 'Next idea'} <ArrowRightIcon />
              </button>
            )}
            <p className="fine">No clock. No score. Just a few clues for your tutor.</p>
          </motion.div>
        ) : (
          <div className="fit-summary">
            <Blob happy />
            <h2 ref={heading} tabIndex={-1}>
              A little more you.
            </h2>
            <p>Tally will start with these suggestions and keep adjusting as you practise.</p>
            {startingQuestions.map((item) => (
              <div className="fit-observation" key={item.id}>
                <CheckIcon />
                <div>
                  <strong>{lessons.find((l) => l.id === item.id)?.title}</strong>
                  <p>
                    {p.tutor.startingPoint.answers[item.id] === 'ready'
                      ? 'Try a fresh question independently.'
                      : 'Begin with a smaller, worked example.'}
                  </p>
                </div>
              </div>
            ))}
            <p className="fine">
              This is just a starting point. Your lessons and practice will show what sticks.
            </p>
            <button
              type="button"
              className="button primary full"
              onClick={() => setChecking(false)}
            >
              Keep shaping my tutor <ArrowRightIcon />
            </button>
          </div>
        )}
        <button type="button" className="text-button fit-back" onClick={() => setChecking(false)}>
          Back to my preferences
        </button>
      </div>
    );
  const observations = lessons
    .filter((l) => p.reviews[l.id]?.attempts)
    .sort((a, b) =>
      (p.reviews[b.id].lastReviewed || '').localeCompare(p.reviews[a.id].lastReviewed || ''),
    )
    .slice(0, 3);
  return (
    <div className="tutor-fit">
      <div className="fit-intro">
        <div className="fit-mascot">
          <Blob happy />
          <i />
          <i />
        </div>
        <span className="eyebrow">YOUR PACE. YOUR NEXT SMALL WIN.</span>
        <h2>A tutor that grows with you.</h2>
        <p>Your answers, hints and confidence shape what comes next. Take as long as you need.</p>
      </div>
      <section className="fit-check-card" aria-label="Starting-point check">
        <span className="fit-check-icon">
          <PathIcon size={24} weight="duotone" />
        </span>
        <div>
          <strong>
            {p.tutor.startingPoint.day
              ? 'Your starting point is saved.'
              : missing > 0
                ? 'Pick up your starting-point check.'
                : 'Find a comfortable starting point.'}
          </strong>
          <p>Three tiny ideas. Optional, untimed, and always changeable.</p>
        </div>
        <button
          type="button"
          className="small-button"
          onClick={() => {
            setStep(missing < 0 ? 3 : missing);
            setAnswer(null);
            setChecking(true);
          }}
        >
          {p.tutor.startingPoint.day ? 'View' : missing > 0 ? 'Continue' : 'Try it'}{' '}
          <ArrowRightIcon />
        </button>
        {p.tutor.startingPoint.day && (
          <button
            type="button"
            className="text-button fit-retake"
            onClick={() => {
              update((old) => ({ ...old, startingPoint: { answers: {} } }));
              setStep(0);
              setAnswer(null);
              setChecking(true);
            }}
          >
            Refresh my starting point
          </button>
        )}
      </section>
      <div className="fit-controls">
        <label>
          How much guidance?
          <select
            aria-label="How much guidance?"
            aria-describedby="tutor-guidance-help"
            value={p.tutor.support}
            onChange={(e) =>
              update((old) => ({ ...old, support: e.target.value as TutorProfile['support'] }))
            }
          >
            <option value="auto">Adapt with me</option>
            <option value="guided">Show smaller steps</option>
            <option value="independent">Let me try independently</option>
          </select>
          <small id="tutor-guidance-help">
            Tally eases off the help when you remember an idea on your own, and brings it back when
            you need a hand.
          </small>
        </label>
        <label>
          Explain new ideas with
          <select
            aria-label="Explain new ideas with"
            aria-describedby="tutor-format-help"
            value={p.tutor.explanation}
            onChange={(e) =>
              update((old) => ({
                ...old,
                explanation: e.target.value as TutorProfile['explanation'],
                formats: {},
              }))
            }
          >
            <option value="auto">Let Tally choose</option>
            <option value="simple">Plain language first</option>
            <option value="example">A worked example first</option>
            <option value="deeper">The deeper connection</option>
          </select>
          <small id="tutor-format-help">
            Choose another format in any explanation to remember it for that topic. Changing this
            default resets those topic choices.
          </small>
        </label>
        <label>
          My practice size
          <select
            aria-label="My practice size"
            aria-describedby="tutor-size-help"
            value={p.tutor.session}
            onChange={(e) =>
              update((old) => ({ ...old, session: e.target.value as TutorProfile['session'] }))
            }
          >
            <option value="auto">Adjust with my progress</option>
            <option value="one">One idea at a time</option>
            <option value="two">Mix two ideas</option>
          </select>
          <small id="tutor-size-help">
            Applies to tutor practice. The daily mix keeps its three activities.
          </small>
        </label>
      </div>
      {!!observations.length && (
        <section className="fit-noticed" aria-label="What Tally is noticing">
          <h3>
            <SparkleIcon weight="duotone" /> What Tally is noticing
          </h3>
          {observations.map((l) => (
            <div className="fit-observation" key={l.id}>
              <span className={`lesson-icon ${l.color}`}>
                <SparkleIcon />
              </span>
              <div>
                <strong>{l.title}</strong>
                <p>
                  {
                    personalChallenge(l.id, p.reviews[l.id], p.tutor, p.experiences.coaching[l.id])
                      .reason
                  }
                </p>
              </div>
            </div>
          ))}
        </section>
      )}
      <p className="fine">
        You can explore every lesson. Preferences and starting clues travel with your progress
        backups and optional encrypted sync.
      </p>
      <button type="button" className="button primary full" onClick={onClose}>
        That feels like me <CheckIcon />
      </button>
    </div>
  );
}
