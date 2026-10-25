'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { feedbackPatterns, isFeedbackCue, type FeedbackCue } from '@/lib/feedback';
import { useSoundscape } from './use-soundscape';

export function useFeedback(sound: boolean, volume: number, haptics: boolean) {
  const playSound = useSoundscape(sound, volume);
  const [hapticsSupported, setHapticsSupported] = useState(false);
  const preference = useRef(haptics);
  preference.current = haptics;
  const lastPulse = useRef(-Infinity);
  const vibrating = useRef(false);

  const stop = useCallback(() => {
    if (!vibrating.current) return;
    vibrating.current = false;
    try {
      navigator.vibrate?.(0);
    } catch {
      // Device policies may disable vibration between interactions.
    }
  }, []);

  const pulse = useCallback((cue: FeedbackCue, options?: { force?: boolean }) => {
    if (
      (!preference.current && !options?.force) ||
      document.hidden ||
      typeof navigator.vibrate !== 'function' ||
      navigator.userActivation?.hasBeenActive === false
    )
      return false;
    const now = performance.now();
    const milestone = ['place', 'correct', 'incorrect', 'complete', 'focus-end'].includes(cue);
    if (!milestone && now - lastPulse.current < 100) return false;
    try {
      const accepted = navigator.vibrate(feedbackPatterns[cue]);
      lastPulse.current = now;
      vibrating.current = accepted;
      return accepted;
    } catch {
      return false;
    }
  }, []);

  const cue = useCallback(
    (name: FeedbackCue, options?: { force?: boolean; volume?: number }) => {
      pulse(name);
      playSound(name, options);
    },
    [playSound, pulse],
  );

  useEffect(() => {
    setHapticsSupported(typeof navigator.vibrate === 'function');
    const hidden = () => {
      if (document.hidden) stop();
    };
    document.addEventListener('visibilitychange', hidden);
    window.addEventListener('pagehide', stop);
    return () => {
      document.removeEventListener('visibilitychange', hidden);
      window.removeEventListener('pagehide', stop);
      stop();
    };
  }, [stop]);

  useEffect(() => {
    if (!haptics) stop();
  }, [haptics, stop]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (!(event.target instanceof Element) || event.defaultPrevented) return;
      const target = event.target.closest<HTMLElement>('[data-tally-sound]');
      if (!target || target.closest('[aria-disabled="true"], [disabled]')) return;
      if (isFeedbackCue(target.dataset.tallySound)) cue(target.dataset.tallySound);
    };
    const onFeedback = (event: Event) => {
      if (event instanceof CustomEvent && isFeedbackCue(event.detail)) cue(event.detail);
    };
    document.addEventListener('click', onClick);
    document.addEventListener('tally-feedback', onFeedback);
    return () => {
      document.removeEventListener('click', onClick);
      document.removeEventListener('tally-feedback', onFeedback);
    };
  }, [cue]);

  return { cue, pulse, hapticsSupported };
}
