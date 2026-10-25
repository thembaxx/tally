'use client';
import { motion, useReducedMotion } from 'motion/react';
import type { ReactNode } from 'react';
import { CheckIcon, ArrowRightIcon, ArrowCounterClockwiseIcon } from '@phosphor-icons/react';
export function AnswerFeedback({
  correct,
  text,
  onNext,
  children,
}: {
  correct: boolean;
  text: string;
  onNext: () => void;
  children?: ReactNode;
}) {
  const still = useReducedMotion();
  return (
    <motion.div
      className={`answer-feedback ${correct ? 'correct' : 'retry'}`}
      initial={still ? false : { opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 360, damping: 27 }}
      role="status"
    >
      <strong>
        <motion.span
          className="feedback-emblem"
          initial={still ? false : { scale: 0.5, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 380, damping: 17 }}
        >
          {correct ? <CheckIcon weight="bold" /> : <ArrowCounterClockwiseIcon />}
        </motion.span>
        {correct ? 'That’s it!' : 'Let’s think it through'}
      </strong>
      <p>{text}</p>
      {children}
      {correct && (
        <button className="button primary full" onClick={onNext}>
          Continue <ArrowRightIcon />
        </button>
      )}
    </motion.div>
  );
}
