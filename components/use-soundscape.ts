'use client';

import { useCallback, useEffect, useRef } from 'react';

// Original, short Web Audio cues informed by the semantic categories of React Bits Sound Lab.
// No audio downloads, network requests, autoplay, or third-party sound dependency.
export type SoundCue =
  | 'tap'
  | 'navigate'
  | 'open'
  | 'select'
  | 'hint'
  | 'flip'
  | 'correct'
  | 'incorrect'
  | 'complete'
  | 'focus-start'
  | 'focus-pause'
  | 'focus-end';

type Note = {
  frequency: number;
  end?: number;
  delay?: number;
  duration: number;
  level: number;
  wave?: OscillatorType;
};

const cues: Record<SoundCue, Note[]> = {
  // Felt / pebble: low, rounded transients rather than a sharp digital tick.
  tap: [{ frequency: 500, end: 370, duration: 0.075, level: 0.085, wave: 'triangle' }],
  navigate: [{ frequency: 475, end: 540, duration: 0.105, level: 0.08, wave: 'sine' }],
  open: [
    { frequency: 480, end: 560, duration: 0.14, level: 0.068, wave: 'sine' },
    { frequency: 720, delay: 0.045, duration: 0.16, level: 0.03, wave: 'sine' },
  ],
  select: [{ frequency: 620, end: 750, duration: 0.09, level: 0.062, wave: 'triangle' }],
  hint: [
    { frequency: 740, duration: 0.15, level: 0.042, wave: 'sine' },
    { frequency: 930, delay: 0.065, duration: 0.2, level: 0.04, wave: 'sine' },
  ],
  flip: [{ frequency: 710, end: 370, duration: 0.09, level: 0.06, wave: 'triangle' }],
  // A warm major third marks learning, not a game-show jackpot.
  correct: [
    { frequency: 523.25, duration: 0.16, level: 0.075, wave: 'sine' },
    { frequency: 659.25, delay: 0.072, duration: 0.21, level: 0.07, wave: 'sine' },
  ],
  // Never use a buzzer or alarm for a mistake.
  incorrect: [{ frequency: 350, end: 295, duration: 0.15, level: 0.053, wave: 'sine' }],
  complete: [
    { frequency: 523.25, duration: 0.22, level: 0.065, wave: 'sine' },
    { frequency: 659.25, delay: 0.095, duration: 0.22, level: 0.061, wave: 'sine' },
    { frequency: 783.99, delay: 0.19, duration: 0.25, level: 0.059, wave: 'sine' },
    { frequency: 1046.5, delay: 0.3, duration: 0.34, level: 0.045, wave: 'sine' },
  ],
  'focus-start': [
    { frequency: 440, duration: 0.21, level: 0.06, wave: 'sine' },
    { frequency: 523.25, delay: 0.1, duration: 0.23, level: 0.044, wave: 'sine' },
  ],
  'focus-pause': [{ frequency: 440, end: 360, duration: 0.13, level: 0.045, wave: 'sine' }],
  'focus-end': [
    { frequency: 392, duration: 0.2, level: 0.06, wave: 'sine' },
    { frequency: 523.25, delay: 0.1, duration: 0.24, level: 0.055, wave: 'sine' },
    { frequency: 783.99, delay: 0.2, duration: 0.31, level: 0.048, wave: 'sine' },
  ],
};

const soundNames = new Set<SoundCue>(Object.keys(cues) as SoundCue[]);

export function useSoundscape(enabled: boolean, volume: number) {
  const context = useRef<AudioContext | null>(null);
  const lastPlayed = useRef<Partial<Record<SoundCue, number>>>({});

  const play = useCallback(
    (cue: SoundCue, options?: { force?: boolean; volume?: number }) => {
      if ((!enabled && !options?.force) || typeof window === 'undefined' || document.hidden)
        return;
      const loudness = Math.max(0, Math.min(100, options?.volume ?? volume)) / 100;
      if (!loudness) return;

      try {
        const now = performance.now();
        const cooldown = cue === 'select' || cue === 'tap' ? 95 : 70;
        if (now - (lastPlayed.current[cue] ?? -Infinity) < cooldown) return;
        lastPlayed.current[cue] = now;

        const ctx = context.current?.state === 'closed' ? null : context.current;
        const audio = ctx ?? new AudioContext();
        context.current = audio;
        if (audio.state === 'suspended') void audio.resume().catch(() => {});
        const base = audio.currentTime + 0.012;
        for (const note of cues[cue]) {
          const start = base + (note.delay ?? 0);
          const end = start + note.duration;
          const oscillator = audio.createOscillator();
          const envelope = audio.createGain();
          oscillator.type = note.wave ?? 'sine';
          oscillator.frequency.setValueAtTime(note.frequency, start);
          if (note.end) {
            oscillator.frequency.exponentialRampToValueAtTime(note.end, end);
          }
          const peak = Math.max(0.0002, note.level * loudness);
          envelope.gain.setValueAtTime(0.0001, start);
          envelope.gain.exponentialRampToValueAtTime(peak, start + 0.012);
          envelope.gain.exponentialRampToValueAtTime(0.0001, end);
          oscillator.connect(envelope);
          envelope.connect(audio.destination);
          oscillator.start(start);
          oscillator.stop(end + 0.01);
          oscillator.onended = () => {
            oscillator.disconnect();
            envelope.disconnect();
          };
        }
      } catch {
        // Unsupported/blocked Web Audio must never interrupt learning or keyboard use.
      }
    },
    [enabled, volume],
  );

  // Explicit opt-in targets inside the lesson dialog are rendered in a Radix portal.
  // Delegate at document level so both the app and its portals use the same sound engine.
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;
      const target = event.target.closest<HTMLElement>('[data-tally-sound]');
      if (!target || target.getAttribute('aria-disabled') === 'true') return;
      if (target instanceof HTMLButtonElement && target.disabled) return;
      const cue = target.dataset.tallySound as SoundCue | undefined;
      if (cue && soundNames.has(cue)) play(cue);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [play]);

  // Reuse one audio context, releasing it when the app unmounts.
  useEffect(
    () => () => {
      if (context.current) void context.current.close().catch(() => {});
      context.current = null;
    },
    [],
  );

  return play;
}
