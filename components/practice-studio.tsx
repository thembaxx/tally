'use client';
import { motion, useReducedMotion } from 'motion/react';
import {
  ArrowUpRightIcon,
  CardsIcon,
  NotebookIcon,
  MagnifyingGlassIcon,
  PathIcon,
} from '@phosphor-icons/react';
import { lessons, type Lesson } from '@/lib/learning';
const formats = [
  {
    id: 'journal-lab',
    name: 'Build an entry',
    description: 'Give every transaction two sides.',
    tag: 'HANDS ON',
    color: 'blue',
    icon: NotebookIcon,
  },
  {
    id: 'spot-the-slip',
    name: 'Spot the slip',
    description: 'Find the why behind a mistake.',
    tag: 'PLAY DETECTIVE',
    color: 'peach',
    icon: MagnifyingGlassIcon,
  },
  {
    id: 'recall',
    name: 'Turn a card',
    description: 'Stretch your memory. Make it stick.',
    tag: 'RECALL & REVEAL',
    color: 'lavender',
    icon: CardsIcon,
  },
  {
    id: 'cashflow',
    name: 'Follow a story',
    description: 'See where the money really goes.',
    tag: 'REAL LIFE',
    color: 'mint',
    icon: PathIcon,
  },
];
export function PracticeStudio({
  onLaunch,
  completed = [],
}: {
  onLaunch: (lesson: Lesson) => void;
  completed?: string[];
}) {
  const still = useReducedMotion();
  return (
    <section className="practice-studio">
      <div className="section-heading">
        <div>
          <span className="eyebrow">THERE’S MORE THAN ONE WAY TO CLICK</span>
          <h2>What feels like you today?</h2>
          <p>Build it. Question it. Turn it around.</p>
        </div>
        <span className="studio-count">4 ways to play</span>
      </div>
      <div className="format-grid">
        {formats.map((f, i) => (
          <motion.button
            type="button"
            className={`format-card ${f.color}`}
            key={f.id}
            onClick={() => {
              const lesson = lessons.find((l) => l.id === f.id);
              if (lesson) onLaunch(lesson);
            }}
            whileHover={still ? {} : { y: -5, rotate: i % 2 ? 0.5 : -0.5 }}
            whileTap={still ? {} : { scale: 0.97 }}
            aria-label={`Try ${f.name}`}
          >
            <span className="format-top">
              <span className="format-icon">
                <f.icon weight="duotone" size={30} />
              </span>
              <span className="format-arrow">
                <ArrowUpRightIcon size={20} />
              </span>
            </span>
            <span className="format-tag">{f.tag}</span>
            <strong>{f.name}</strong>
            <span className="format-description">{f.description}</span>
            <span className="format-time">
              {completed.includes(f.id) ? 'Come play again' : 'A new little adventure'}{' '}
              <span className="mono">{lessons.find((l) => l.id === f.id)?.minutes} min</span>
            </span>
          </motion.button>
        ))}
      </div>
    </section>
  );
}
