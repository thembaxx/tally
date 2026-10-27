'use client';

import { useState } from 'react';
import type { Progress } from '@/lib/learning';
import { learnerNumber } from '@/lib/south-africa';
import {
  transferCase,
  transferEligibility,
  createTransferResult,
  transferReport,
  type TransferResult,
} from '@/lib/transfer-assessment';

export function TransferAssessment({
  progress,
  today,
  onSave,
  onDraftChange,
}: {
  progress: Progress;
  today: string;
  onSave: (result: TransferResult) => void;
  onDraftChange: (draft: Progress['transferDraft']) => void;
}) {
  const eligibility = transferEligibility(progress, today);
  const draft = progress.transferDraft;
  const { answers, hints, seenSolutions } = draft;
  const result = seenSolutions ? progress.transferResults.at(-1) : undefined;
  const [error, setError] = useState('');
  const download = () => {
    const url = URL.createObjectURL(
      new Blob([transferReport(progress, progress.transferResults, today)], {
        type: 'text/plain;charset=utf-8',
      }),
    );
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tally-learning-report.txt';
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return (
    <section className="activity-card" aria-labelledby="transfer-title">
      <h2 id="transfer-title">Apply it to a new business</h2>
      <p>{transferCase.description}</p>
      <p>{eligibility.reason}</p>
      {(eligibility.eligible || seenSolutions) && (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (seenSolutions || !eligibility.eligible) return;
            const values = Object.fromEntries(
              transferCase.questions.map((question) => [
                question.id,
                learnerNumber(answers[question.id] || ''),
              ]),
            );
            if (Object.values(values).some((value) => value === null)) {
              setError('Enter a number for every question before checking.');
              return;
            }
            if (Object.values(values).some((value) => value !== null && Math.abs(value) > 1e9)) {
              setError('Use numbers between −1 000 000 000 and 1 000 000 000.');
              return;
            }
            try {
              const saved = createTransferResult({
                completedOn: today,
                eligibleOn: eligibility.availableOn!,
                answers: values,
                hints,
              });
              onSave(saved);
              onDraftChange({ ...draft, seenSolutions: true });
              setError('');
            } catch (cause) {
              setError(
                cause instanceof Error
                  ? cause.message
                  : 'This attempt could not be saved. Check your answers and try again.',
              );
            }
          }}
        >
          <h3>{transferCase.title}</h3>
          <p>{transferCase.story}</p>
          {transferCase.questions.map((question) => (
            <div className="field" key={question.id}>
              <label htmlFor={`transfer-${question.id}`}>{question.label}</label>
              <input
                id={`transfer-${question.id}`}
                inputMode="decimal"
                maxLength={100}
                aria-describedby={error ? 'transfer-error' : undefined}
                aria-invalid={!!error}
                value={
                  answers[question.id] ??
                  result?.responses.find((response) => response.questionId === question.id)
                    ?.answer ??
                  ''
                }
                disabled={seenSolutions}
                onChange={(event) => {
                  onDraftChange({
                    ...draft,
                    answers: { ...answers, [question.id]: event.target.value },
                  });
                  setError('');
                }}
              />
              <button
                type="button"
                className="button outline"
                disabled={!!hints[question.id] || seenSolutions}
                onClick={() => onDraftChange({ ...draft, hints: { ...hints, [question.id]: 1 } })}
              >
                Show hint
              </button>
              {!!hints[question.id] && <p>{question.hint}</p>}
              {seenSolutions && (
                <p>
                  {result?.responses.find((response) => response.questionId === question.id)
                    ?.correct
                    ? 'Correct final answer. '
                    : 'Review this answer. '}
                  {question.explanation}
                </p>
              )}
            </div>
          ))}
          <p id="transfer-error" role="alert">
            {error}
          </p>
          <button className="button dark" disabled={seenSolutions}>
            Check and save this attempt
          </button>
          {result && (
            <p role="status">
              {result.correct} of {result.total} correct; {result.hints} hints. Recorded separately
              from XP and independent recall. This familiar case is now for revision; repeating it
              does not establish new transfer evidence.
            </p>
          )}
          {seenSolutions && !result && (
            <p role="status">
              You have already seen the worked solutions for this case. It remains available for
              revision; another submission cannot establish fresh transfer evidence.
            </p>
          )}
        </form>
      )}
      <p>
        {progress.transferResults.length} recorded transfer attempt(s). Your report contains
        recorded dates and support used, without a mastery certificate.
      </p>
      <button type="button" className="button outline" onClick={download}>
        Download my learning report
      </button>
    </section>
  );
}
