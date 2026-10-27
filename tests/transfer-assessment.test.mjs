import test from 'node:test';
import assert from 'node:assert/strict';
import {
  transferCase,
  transferEligibility,
  checkTransferAnswers,
  createTransferResult,
  readTransferResults,
  transferReport,
} from '../lib/transfer-assessment.ts';

const independent = (day) => ({
  lastReviewed: day,
  attempts: 1,
  total: 1,
  firstTry: 1,
  mistakes: 0,
  hints: 0,
  guided: false,
  confidence: 'Getting there',
  streak: 1,
});
const progress = {
  name: 'Nomsa',
  completed: ['equation', 'statements'],
  reviews: { equation: independent('2026-10-23'), statements: independent('2026-10-24') },
};
const answers = {
  'opening-equity': 2400 - 900,
  'gross-profit': 1800 - 650,
  'operating-profit': 1800 - 650 - 300,
  'closing-cash': 1200 + 1300 - 650 - 300,
};
const saved = () =>
  createTransferResult({ completedOn: '2026-10-27', eligibleOn: '2026-10-27', answers });

test('waits three calendar days after the latest relevant independent practice', () => {
  assert.equal(transferEligibility(progress, '2026-10-26').eligible, false);
  assert.deepEqual(transferEligibility(progress, '2026-10-27').evidenceDays, {
    equation: '2026-10-23',
    statements: '2026-10-24',
  });
  assert.equal(transferEligibility(progress, '2026-10-27').availableOn, '2026-10-27');
  assert.equal(transferEligibility(progress, '2026-10-27').eligible, true);
  const monthEnd = {
    reviews: { equation: independent('2026-01-30'), statements: independent('2026-01-31') },
  };
  assert.equal(transferEligibility(monthEnd, '2026-02-02').eligible, false);
  assert.equal(transferEligibility(monthEnd, '2026-02-03').eligible, true);
});

test('completion, hints, retries, guidance and future dates cannot establish independence', () => {
  assert.equal(
    transferEligibility({ completed: ['equation', 'statements'] }, '2026-10-27').eligible,
    false,
  );
  for (const patch of [
    { hints: 1 },
    { mistakes: 1 },
    { guided: true },
    { confidence: 'Still learning' },
    { streak: 0 },
    { total: 0 },
    { attempts: 0 },
    { lastReviewed: '2026-10-28' },
    { lastReviewed: '2026-02-30' },
  ]) {
    const changed = {
      reviews: { ...progress.reviews, equation: { ...progress.reviews.equation, ...patch } },
    };
    assert.equal(transferEligibility(changed, '2026-10-27').eligible, false, JSON.stringify(patch));
  }
  assert.throws(() => transferEligibility(progress, 'not-a-day'), RangeError);
});

test('authored business balances and distinguishes profit, receivables and cash', () => {
  assert.equal(
    1200 + answers['closing-cash'] + 500,
    900 + answers['opening-equity'] + answers['operating-profit'],
  );
  assert.equal(checkTransferAnswers(answers).filter((answer) => answer.correct).length, 4);
  assert.equal(checkTransferAnswers({ 'opening-equity': '1500' })[0].correct, false);
  assert.equal(checkTransferAnswers({ 'opening-equity': 'not 1500' })[0].correct, false);
  assert.equal(checkTransferAnswers({ 'closing-cash': 850 })[3].correct, false);
});

test('results record attempts and hints without rewriting learning evidence', () => {
  const original = structuredClone(progress);
  const result = createTransferResult({
    completedOn: '2026-10-27',
    eligibleOn: '2026-10-27',
    answers,
    attempts: { 'gross-profit': 2 },
    hints: { 'gross-profit': 1 },
  });
  assert.equal(result.correct, 4);
  assert.equal(result.attempts, 5);
  assert.equal(result.hints, 1);
  assert.deepEqual(progress, original);
  assert.throws(
    () => createTransferResult({ completedOn: '2026-10-26', eligibleOn: '2026-10-27', answers }),
    RangeError,
  );
  assert.throws(
    () =>
      createTransferResult({ completedOn: '2026-10-27', eligibleOn: '2026-10-27', answers: {} }),
    RangeError,
  );
});

test('restore bounds records, rejects malformed values and recomputes claimed scores', () => {
  const result = saved();
  assert.deepEqual(readTransferResults(JSON.parse(JSON.stringify([result]))), [result]);
  assert.equal(readTransferResults(Array(30).fill(result)).length, 20);
  assert.equal(readTransferResults([{ ...result, correct: 100, attempts: 900 }])[0].correct, 4);
  const wrong = structuredClone(result);
  wrong.responses[0].answer = 999;
  assert.equal(readTransferResults([wrong])[0].correct, 3);
  for (const patch of [
    { version: 2 },
    { caseId: 'unknown' },
    { completedOn: '2026-02-30' },
    { responses: [] },
    { responses: [{ ...result.responses[0], attempts: 1e9 }, ...result.responses.slice(1)] },
    { responses: [{ ...result.responses[0], answer: Number.NaN }, ...result.responses.slice(1)] },
  ])
    assert.deepEqual(readTransferResults([{ ...result, ...patch }]), []);
  assert.deepEqual(readTransferResults(null), []);
});

test('learner-owned report shows dates/support and states its assessment limits', () => {
  const result = saved();
  const report = transferReport(progress, [result], '2026-10-28');
  assert.match(report, /Nomsa/);
  assert.match(report, /2026-10-27 \(SAST\)/);
  assert.match(report, /Recorded attempts: 4 · Hints used: 0/);
  assert.match(report, /not a validated mastery score/);
  assert.match(report, /same authored case/);
  assert.equal(transferCase.questions.length, 4);
});
