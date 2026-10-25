'use client';
import { useRef, useState } from 'react';
import { coachPlans } from '@/lib/coaching';
import { Blob } from './brand';
export function TutorSupport({ id, onHelp }: { id: string; onHelp: () => void }) {
  const [open, setOpen] = useState(false);
  const used = useRef(false);
  const plan = coachPlans[id] || coachPlans.equation;
  return (
    <aside className="tutor-rescue" aria-label="A smaller step">
      <div className="tutor-rescue-heading">
        <Blob small />
        <div>
          <strong>Let’s make a little space.</strong>
          <p>Try another angle. Your question will stay right here.</p>
        </div>
      </div>
      <button
        type="button"
        className="text-button"
        data-tally-sound="hint"
        aria-expanded={open}
        onClick={() => {
          setOpen(!open);
          if (!open && !used.current) {
            used.current = true;
            onHelp();
          }
        }}
      >
        {open ? 'Hide the worked example' : 'Show a worked example'}
      </button>
      {open && (
        <div className="tutor-rescue-example" role="note">
          <p>{plan.simple}</p>
          <p>
            <strong>Another example:</strong> {plan.worked}
          </p>
        </div>
      )}
    </aside>
  );
}
