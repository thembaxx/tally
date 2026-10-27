/** Authored transfer practice. Callers supply a day from southAfricanDay(). */
export const transferCase = {
  id: 'bicycle-repairs-v1',
  title: 'A new business: Nomvula’s Bicycle Repairs',
  description:
    'Apply accounting ideas to a business you have not used in your lessons. Try each question before opening a hint. This is practice, not a qualification or a validated mastery assessment.',
  story:
    'Nomvula starts with R2 400 of assets, including R900 financed by a loan. She buys R1 200 of equipment with business cash, leaving R1 200 cash. During the month she earns R1 800 from repairs: customers pay R1 300 and still owe R500. Parts used in those repairs cost R650, paid in cash. Rent is R300, also paid in cash. There are no other transactions. Leave VAT and depreciation out of this exercise.',
  topics: ['equation', 'statements'],
  questions: [
    {
      id: 'opening-equity',
      label: 'What was the owner’s equity at the start (R)?',
      answer: 1500,
      hint: 'Opening equity = opening assets − the loan.',
      explanation: 'R2 400 − R900 = R1 500 of opening equity.',
    },
    {
      id: 'gross-profit',
      label: 'What is gross profit for the month (R)?',
      answer: 1150,
      hint: 'Gross profit = earned revenue − cost of sales. Include repairs not yet paid for.',
      explanation: 'R1 800 earned revenue − R650 cost of parts used = R1 150 gross profit.',
    },
    {
      id: 'operating-profit',
      label: 'What is operating profit for the month (R)?',
      answer: 850,
      hint: 'Subtract rent from gross profit. The equipment purchase is not an expense here.',
      explanation: 'R1 150 gross profit − R300 rent = R850 operating profit.',
    },
    {
      id: 'closing-cash',
      label: 'How much cash remains at the end of the month (R)?',
      answer: 1550,
      hint: 'Start with R1 200 cash after buying equipment. Add cash received, then subtract parts and rent paid.',
      explanation: 'R1 200 + R1 300 − R650 − R300 = R1 550 cash. The R500 receivable is not cash.',
    },
  ],
} as const;

type ReviewEvidence = {
  lastReviewed?: string;
  attempts?: number;
  total?: number;
  firstTry?: number;
  mistakes?: number;
  hints?: number;
  guided?: boolean;
  confidence?: string;
  streak?: number;
};
type TransferProgress = {
  name?: string;
  completed?: readonly string[];
  reviews?: Record<string, ReviewEvidence>;
};
export type TransferEligibility = {
  eligible: boolean;
  availableOn: string | null;
  evidenceDays: Record<string, string>;
  reason: string;
};
export type TransferResponse = {
  questionId: string;
  answer: number | null;
  attempts: number;
  hints: number;
  correct: boolean;
};
export type TransferResult = {
  version: 1;
  caseId: typeof transferCase.id;
  completedOn: string;
  eligibleOn: string;
  responses: TransferResponse[];
  correct: number;
  total: number;
  attempts: number;
  hints: number;
};

function isDay(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
function integer(value: unknown, max = 100): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= max;
}
function independent(
  review: ReviewEvidence | undefined,
  today: string,
): review is ReviewEvidence & {
  lastReviewed: string;
} {
  return !!(
    review &&
    isDay(review.lastReviewed) &&
    review.lastReviewed <= today &&
    typeof review.total === 'number' &&
    Number.isFinite(review.total) &&
    review.total > 0 &&
    typeof review.attempts === 'number' &&
    Number.isFinite(review.attempts) &&
    review.attempts > 0 &&
    review.mistakes === 0 &&
    review.hints === 0 &&
    !review.guided &&
    (review.confidence === 'Getting there' || review.confidence === 'It clicked!') &&
    typeof review.streak === 'number' &&
    review.streak > 0
  );
}

/** Latest clean independent equation and statement practice must be three SAST days old. */
export function transferEligibility(
  progress: TransferProgress,
  today: string,
): TransferEligibility {
  if (!isDay(today)) throw new RangeError('Use a valid South African calendar day.');
  const evidenceDays: Record<string, string> = {};
  for (const topic of transferCase.topics) {
    const review = progress.reviews?.[topic];
    if (!independent(review, today))
      return {
        eligible: false,
        availableOn: null,
        evidenceDays,
        reason:
          'First practise The Equation and Statements independently, without hints or retries.',
      };
    evidenceDays[topic] = review.lastReviewed;
  }
  const latest = Object.values(evidenceDays).sort().at(-1)!;
  const date = new Date(`${latest}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 3);
  const availableOn = date.toISOString().slice(0, 10);
  return {
    eligible: today >= availableOn,
    availableOn,
    evidenceDays,
    reason:
      today >= availableOn
        ? 'Three South African calendar days have passed since your latest relevant independent practice.'
        : `Try this new business from ${availableOn}, after three South African calendar days. Ordinary lessons and practice remain available.`,
  };
}

/** Parse text with learnerNumber before calling; prose and partial keyword matches are not graded. */
export function checkTransferAnswers(answers: Record<string, number | null | undefined>) {
  return transferCase.questions.map((question) => ({
    questionId: question.id,
    correct: typeof answers[question.id] === 'number' && answers[question.id] === question.answer,
    explanation: question.explanation,
  }));
}

export function createTransferResult(input: {
  completedOn: string;
  eligibleOn: string;
  answers: Record<string, number | null | undefined>;
  attempts?: Record<string, number | undefined>;
  hints?: Record<string, number | undefined>;
}): TransferResult {
  if (!isDay(input.completedOn) || !isDay(input.eligibleOn) || input.completedOn < input.eligibleOn)
    throw new RangeError('Complete the transfer practice on or after its available date.');
  const responses = transferCase.questions.map((question): TransferResponse => {
    const answer = input.answers[question.id] ?? null;
    const attempts = input.attempts?.[question.id] ?? (answer === null ? 0 : 1);
    const hints = input.hints?.[question.id] ?? 0;
    if (
      (answer !== null &&
        (typeof answer !== 'number' || !Number.isFinite(answer) || Math.abs(answer) > 1e9)) ||
      !integer(attempts) ||
      !integer(hints) ||
      (answer !== null && attempts < 1)
    )
      throw new RangeError('Invalid transfer answer, attempt count or hint count.');
    return {
      questionId: question.id,
      answer,
      attempts,
      hints,
      correct: answer === question.answer,
    };
  });
  if (responses.some((response) => response.attempts === 0))
    throw new RangeError('Try every question before saving the assessment.');
  return {
    version: 1,
    caseId: transferCase.id,
    completedOn: input.completedOn,
    eligibleOn: input.eligibleOn,
    responses,
    correct: responses.filter((response) => response.correct).length,
    total: responses.length,
    attempts: responses.reduce((total, response) => total + response.attempts, 0),
    hints: responses.reduce((total, response) => total + response.hints, 0),
  };
}

/** Bound imported history and recompute scores rather than trusting saved totals. */
export function readTransferResults(value: unknown): TransferResult[] {
  if (!Array.isArray(value)) return [];
  return value.slice(-20).flatMap((raw) => {
    if (
      !raw ||
      typeof raw !== 'object' ||
      raw.version !== 1 ||
      raw.caseId !== transferCase.id ||
      !Array.isArray(raw.responses) ||
      raw.responses.length !== transferCase.questions.length
    )
      return [];
    const answers: Record<string, number | null> = {};
    const attempts: Record<string, number> = {};
    const hints: Record<string, number> = {};
    for (let index = 0; index < transferCase.questions.length; index++) {
      const question = transferCase.questions[index];
      const response = raw.responses[index];
      if (
        !response ||
        response.questionId !== question.id ||
        response.answer === undefined ||
        !integer(response.attempts) ||
        !integer(response.hints)
      )
        return [];
      answers[question.id] = response.answer;
      attempts[question.id] = response.attempts;
      hints[question.id] = response.hints;
    }
    try {
      return [
        createTransferResult({
          completedOn: raw.completedOn,
          eligibleOn: raw.eligibleOn,
          answers,
          attempts,
          hints,
        }),
      ];
    } catch {
      return [];
    }
  });
}

export function transferReport(
  progress: TransferProgress,
  results: unknown,
  today: string,
): string {
  if (!isDay(today)) throw new RangeError('Use a valid South African calendar day.');
  const name = (progress.name || 'Learner')
    .split('')
    .map((character) => (character.charCodeAt(0) < 32 ? ' ' : character))
    .join('')
    .slice(0, 30);
  const clean = readTransferResults(results);
  const history = clean.flatMap((result) => [
    '',
    `${result.completedOn} (SAST) · ${transferCase.title}`,
    `Available from: ${result.eligibleOn} · Correct answers: ${result.correct}/${result.total}`,
    `Recorded attempts: ${result.attempts} · Hints used: ${result.hints}`,
    ...result.responses.map(
      (response) =>
        `${response.questionId}: ${response.correct ? 'correct final answer' : 'needs review'}; ${response.attempts} attempt(s), ${response.hints} hint(s).`,
    ),
  ]);
  return [
    'Tally · My recorded learning progress',
    `${name} · Exported ${today} (Africa/Johannesburg)`,
    `Lessons completed: ${new Set(progress.completed || []).size}`,
    ...transferCase.topics.map((topic) => {
      const review = progress.reviews?.[topic];
      return `${topic}: ${review?.lastReviewed && isDay(review.lastReviewed) ? review.lastReviewed : 'no recorded date'}; ${review?.attempts || 0} practice attempt(s), ${review?.hints || 0} hint(s) in the latest practice.`;
    }),
    `Transfer practice records: ${clean.length}`,
    ...history,
    '',
    'This report describes locally recorded practice, including retries and hints. A correct final answer after support is not independent first-attempt recall. Repeated runs use the same authored case and are not fresh transfer assessments. This is not a validated mastery score, qualification or teacher-verified record.',
  ].join('\n');
}
