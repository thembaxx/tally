export type ChoiceChallenge = {
  title: string;
  story: string;
  question: string;
  options: { id: string; label: string; explanation: string }[];
  correct: string;
  tip: string;
  illustration?: 'flow' | 'journal';
};
export type JournalChallenge = {
  title: string;
  story: string;
  accounts: string[];
  debit: string;
  credit: string;
  amount: number;
  explanation: string;
  tip: string;
};
export type RecallCard = {
  id: string;
  question: string;
  answer: string;
  explanation: string;
  example: string;
};
export type StudioActivity =
  | { type: 'choice'; challenge: ChoiceChallenge }
  | { type: 'journal'; challenge: JournalChallenge }
  | { type: 'recall'; cards: RecallCard[] };
