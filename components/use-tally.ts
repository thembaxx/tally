'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  initialProgress,
  localDay,
  readProgress,
  STORAGE_KEY,
  type Progress,
} from '@/lib/learning';
export function useTally() {
  const [progress, setProgress] = useState<Progress>(initialProgress);
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState(false);
  // Keep prerendered HTML identical across dates and time zones; use the device's
  // calendar after hydration for challenges and streaks.
  const [today, setToday] = useState('2000-01-01');
  useEffect(() => {
    try {
      setProgress(readProgress(localStorage.getItem(STORAGE_KEY)));
    } catch {
      setStorageError(true);
    }
    setToday(localDay());
    setReady(true);
    const sync = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setProgress(readProgress(e.newValue));
    };
    window.addEventListener('storage', sync);
    const interval = setInterval(() => setToday(localDay()), 15000);
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', sync);
    };
  }, []);
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch {
      setStorageError(true);
    }
  }, [progress, ready]);
  return { progress, setProgress, ready, storageError, today };
}
export function useTheme(theme: Progress['theme'], focus: boolean) {
  useEffect(() => {
    const media = matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const dark = focus || theme === 'dark' || (theme === 'system' && media.matches);
      document.documentElement.dataset.theme = dark ? 'dark' : 'light';
      document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
      document
        .querySelector('meta[name="theme-color"]')
        ?.setAttribute('content', dark ? '#181a1b' : '#f8f7f3');
      try {
        localStorage.setItem('tally-theme', theme);
      } catch {
        /* Theme still works for this visit. */
      }
    };
    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [theme, focus]);
}
export function useFocus(onFinish: () => void) {
  const [active, setActive] = useState(false);
  const [paused, setPaused] = useState(false);
  const [remaining, setRemaining] = useState(300);
  const [hidden, setHidden] = useState(false);
  const finish = useRef(onFinish);
  const awarded = useRef(false);
  finish.current = onFinish;
  useEffect(() => {
    function change() {
      setHidden(document.hidden);
    }
    document.addEventListener('visibilitychange', change);
    return () => document.removeEventListener('visibilitychange', change);
  }, []);
  useEffect(() => {
    if (!active || paused || hidden) return;
    let last = Date.now();
    const interval = setInterval(() => {
      const now = Date.now();
      if (document.hidden) {
        last = now;
        return;
      }
      const delta = (now - last) / 1000;
      last = now;
      setRemaining((r) => Math.max(0, r - delta));
    }, 250);
    return () => clearInterval(interval);
  }, [active, paused, hidden]);
  useEffect(() => {
    if (active && remaining <= 0 && !awarded.current) {
      awarded.current = true;
      setActive(false);
      finish.current();
    }
  }, [active, remaining]);
  const start = useCallback(() => {
    if (!active) {
      setRemaining(300);
      awarded.current = false;
      setPaused(false);
      setActive(true);
    }
  }, [active]);
  const stop = () => {
    setActive(false);
    setPaused(false);
    setRemaining(300);
  };
  return {
    active,
    paused: paused || hidden,
    remaining,
    start,
    stop,
    togglePause: () => setPaused((v) => !v),
  };
}
