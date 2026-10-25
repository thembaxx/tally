'use client';
import { createContext, useContext, useState, type ReactNode } from 'react';
import { LightbulbIcon, BookOpenIcon, ChatCircleDotsIcon } from '@phosphor-icons/react';
import { coachPlans, glossary } from '@/lib/coaching';
import type { CoachingEvidence } from '@/lib/experiences';
import { Segmented } from './ui/controls';
type CoachContext = {
  id: string;
  evidence?: CoachingEvidence;
  save?: (id: string, evidence: CoachingEvidence) => void;
};
const Context = createContext<CoachContext>({ id: 'equation' });
export function CoachScope({
  id,
  evidence,
  save,
  children,
}: CoachContext & { children: ReactNode }) {
  return <Context.Provider value={{ id, evidence, save }}>{children}</Context.Provider>;
}
export function ExplanationTools({ id }: { id: string }) {
  const [mode, setMode] = useState('simple');
  const p = coachPlans[id] || coachPlans.equation;
  return (
    <details className="coach-tools">
      <summary>
        <LightbulbIcon /> Explain it my way
      </summary>
      <div className="coach-content">
        <Segmented
          label="Explanation style"
          value={mode}
          onChange={setMode}
          items={[
            { id: 'simple', label: 'Simply' },
            { id: 'example', label: 'Example' },
            { id: 'deeper', label: 'Go deeper' },
          ]}
        />
        <p role="status">
          {mode === 'simple' ? p.simple : mode === 'example' ? p.worked : p.deeper}
        </p>
        <Glossary />
      </div>
    </details>
  );
}
export function Glossary() {
  const [term, setTerm] = useState<string>('Asset');
  return (
    <details className="glossary">
      <summary>
        <BookOpenIcon /> Accounting wordbook
      </summary>
      <label>
        Choose a term
        <select value={term} onChange={(e) => setTerm(e.target.value)}>
          {glossary.map(([name]) => (
            <option key={name}>{name}</option>
          ))}
        </select>
      </label>
      <p role="status">{glossary.find(([name]) => name === term)?.[1]}</p>
    </details>
  );
}
export function WhyCoach({ correct }: { correct: boolean }) {
  const { id, evidence, save } = useContext(Context);
  const p = coachPlans[id] || coachPlans.equation;
  const [open, setOpen] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [note, setNote] = useState(evidence?.note || '');
  function choose(value: string) {
    setAnswer(value);
    if (save)
      save(id, {
        tries: (evidence?.tries || 0) + 1,
        explained: (evidence?.explained || 0) + (value === p.right ? 1 : 0),
        misconception: value === p.right ? '' : p.misconception,
        note,
      });
  }
  return (
    <div className="why-coach">
      <button
        type="button"
        className="text-button"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <ChatCircleDotsIcon /> {correct ? 'Why does that work?' : 'Walk me through it'}
      </button>
      {open && (
        <div className="coach-content">
          {evidence && evidence.tries >= 2 && evidence.misconception && (
            <p className="coach-pattern">Let’s revisit: {evidence.misconception}</p>
          )}
          <p>
            <strong>{p.question}</strong>
          </p>
          <div className="reason-options">
            {[p.trap, p.right].map((option) => (
              <button
                type="button"
                key={option}
                aria-pressed={answer === option}
                onClick={() => choose(option)}
              >
                {option}
              </button>
            ))}
          </div>
          {answer && (
            <div role="status">
              <strong>
                {answer === p.right ? 'Yes — that is the connection.' : p.misconception}
              </strong>
              <p>{p.worked}</p>
            </div>
          )}
          <label>
            In your own words <span className="fine">(optional, saved privately)</span>
            <textarea
              value={note}
              maxLength={1000}
              rows={2}
              onChange={(e) => setNote(e.target.value)}
              placeholder="I understand it because…"
            />
          </label>
          <button
            type="button"
            className="small-button"
            onClick={() => {
              save?.(id, {
                tries: evidence?.tries || 0,
                explained: evidence?.explained || 0,
                misconception: evidence?.misconception || '',
                note,
              });
              setOpen(false);
            }}
          >
            Save my thinking
          </button>
          <ExplanationTools id={id} />
          <p className="fine">
            A reflection, not a graded answer. Your wording is yours; Tali does not automatically
            assess it.
          </p>
        </div>
      )}
    </div>
  );
}
