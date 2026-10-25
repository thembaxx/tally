'use client';

import { useCallback, useEffect, useRef } from 'react';

import type { FeedbackCue } from '@/lib/feedback';
export type SoundCue = FeedbackCue;

// React Bits Sound Lab exports are served locally. Original synth cues provide an
// immediate first-interaction fallback while the small MP3s decode, and work if a file fails.
const soundFiles: Partial<Record<SoundCue, string>> = {
  tap: 'felt',
  pickup: 'felt',
  navigate: 'tab',
  open: 'unfold',
  select: 'check',
  place: 'place',
  correct: 'tally',
  complete: 'bloom',
};

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
  pickup: [{ frequency: 420, end: 580, duration: 0.07, level: 0.06, wave: 'triangle' }],
  place: [{ frequency: 380, end: 260, duration: 0.1, level: 0.08, wave: 'triangle' }],
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

export function useSoundscape(enabled: boolean, volume: number) {
  const context = useRef<AudioContext | null>(null);
  const settings = useRef({ enabled, volume });
  settings.current = { enabled, volume };
  const lastPlayed = useRef<Partial<Record<SoundCue, number>>>({});
  const encoded = useRef(new Map<string, Promise<ArrayBuffer>>());
  const decoded = useRef(new Map<string, AudioBuffer>());
  const warming = useRef(new Set<string>());
  const voices = useRef(new Map<AudioScheduledSourceNode, GainNode>());
  const epoch = useRef(0);

  const stop = useCallback(() => {
    epoch.current += 1;
    for (const [source, gain] of voices.current) {
      source.onended = null;
      try {
        source.stop();
      } catch {
        // A source may have finished between the visibility event and this loop.
      }
      source.disconnect();
      gain.disconnect();
    }
    voices.current.clear();
  }, []);

  const preload = useCallback(() => {
    for (const name of new Set(Object.values(soundFiles))) {
      if (encoded.current.has(name)) continue;
      const pending = fetch(`/sounds/${name}-v1.mp3`).then((response) => {
        if (!response.ok) throw new Error('Sound unavailable');
        return response.arrayBuffer();
      });
      encoded.current.set(name, pending);
      // Fetch failure is optional feedback, never an unhandled page error.
      void pending.catch(() => {});
    }
  }, []);

  const warm = useCallback((audio: AudioContext) => {
    for (const [name, pending] of encoded.current) {
      if (decoded.current.has(name) || warming.current.has(name)) continue;
      warming.current.add(name);
      void pending
        .then((bytes) => audio.decodeAudioData(bytes.slice(0)))
        .then((buffer) => decoded.current.set(name, buffer))
        .catch(() => {})
        .finally(() => warming.current.delete(name));
    }
  }, []);

  const play = useCallback(
    (cue: SoundCue, options?: { force?: boolean; volume?: number }) => {
      if (
        (!settings.current.enabled && !options?.force) ||
        document.hidden ||
        navigator.userActivation?.hasBeenActive === false
      )
        return;
      const loudness = Math.max(0, Math.min(100, options?.volume ?? settings.current.volume)) / 100;
      if (!loudness) return;
      const now = performance.now();
      if (now - (lastPlayed.current[cue] ?? -Infinity) < 100) return;
      lastPlayed.current[cue] = now;
      const ticket = epoch.current;

      try {
        const audio = context.current?.state !== 'closed' ? context.current : null;
        const ctx = audio ?? new AudioContext({ latencyHint: 'interactive' });
        context.current = ctx;
        preload();
        warm(ctx);
        const schedule = () => {
          // Never replay a queued cue after muting, hiding, or returning to the tab.
          if (
            epoch.current !== ticket ||
            document.hidden ||
            ctx.state !== 'running' ||
            performance.now() - now > 250
          )
            return;
          if ((!settings.current.enabled && !options?.force) || !settings.current.volume) return;
          const base = ctx.currentTime + 0.004;
          const connect = (source: AudioScheduledSourceNode, gain: GainNode) => {
            source.connect(gain);
            gain.connect(ctx.destination);
            voices.current.set(source, gain);
            source.onended = () => {
              voices.current.delete(source);
              source.disconnect();
              gain.disconnect();
            };
          };
          const file = soundFiles[cue];
          const buffer = file && decoded.current.get(file);
          if (buffer) {
            const source = ctx.createBufferSource();
            const gain = ctx.createGain();
            source.buffer = buffer;
            gain.gain.setValueAtTime(loudness * 0.65, base);
            connect(source, gain);
            source.start(base);
          } else {
            for (const note of cues[cue]) {
              const start = base + (note.delay ?? 0);
              const end = start + note.duration;
              const oscillator = ctx.createOscillator();
              const envelope = ctx.createGain();
              oscillator.type = note.wave ?? 'sine';
              oscillator.frequency.setValueAtTime(note.frequency, start);
              if (note.end) oscillator.frequency.exponentialRampToValueAtTime(note.end, end);
              envelope.gain.setValueAtTime(0.0001, start);
              envelope.gain.exponentialRampToValueAtTime(
                Math.max(0.0002, note.level * loudness),
                start + 0.012,
              );
              envelope.gain.exponentialRampToValueAtTime(0.0001, end);
              connect(oscillator, envelope);
              oscillator.start(start);
              oscillator.stop(end + 0.01);
            }
          }
        };
        if (ctx.state !== 'running')
          void ctx
            .resume()
            .then(schedule)
            .catch(() => {});
        else schedule();
      } catch {
        // Unsupported/blocked Web Audio must never interrupt learning or keyboard use.
      }
    },
    [preload, warm],
  );

  useEffect(() => {
    if (enabled && volume > 0) preload();
    else stop();
  }, [enabled, volume, preload, stop]);

  useEffect(() => {
    const hide = () => {
      stop();
      if (context.current?.state === 'running') void context.current.suspend().catch(() => {});
    };
    const visibility = () => {
      if (document.hidden) hide();
    };
    document.addEventListener('visibilitychange', visibility);
    window.addEventListener('pagehide', hide);
    return () => {
      document.removeEventListener('visibilitychange', visibility);
      window.removeEventListener('pagehide', hide);
      stop();
      if (context.current) void context.current.close().catch(() => {});
      context.current = null;
    };
  }, [stop]);

  return play;
}
