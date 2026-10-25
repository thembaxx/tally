import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { initialProgress } from '../lib/learning';

type Probe = {
  contexts: number;
  decoded: number;
  samples: number;
  tones: number;
  active: number;
  stopped: number;
  resumes: number;
  pulses: (number | number[])[];
};
declare global {
  interface Window {
    tallyAudioProbe: Probe;
  }
}
async function start(page: Page, options: { sound?: boolean; broken?: boolean } = {}) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(
    ({ progress, broken }) => {
      if (!localStorage.getItem('tally-progress-v1'))
        localStorage.setItem('tally-progress-v1', JSON.stringify(progress));
      const probe: Probe = {
        contexts: 0,
        decoded: 0,
        samples: 0,
        tones: 0,
        active: 0,
        stopped: 0,
        resumes: 0,
        pulses: [],
      };
      window.tallyAudioProbe = probe;
      Object.defineProperty(navigator, 'vibrate', {
        configurable: true,
        value: (pattern: number | number[]) => {
          if (broken) throw new Error('Device blocked vibration');
          probe.pulses.push(pattern);
          return true;
        },
      });
      const Native = window.AudioContext;
      const observe = (source: AudioScheduledSourceNode, sampled: boolean) => {
        const originalStart = source.start.bind(source),
          originalStop = source.stop.bind(source);
        let active = false;
        source.start = (when?: number) => {
          active = true;
          probe.active += 1;
          if (sampled) probe.samples += 1;
          else probe.tones += 1;
          originalStart(when);
        };
        source.stop = (when?: number) => {
          probe.stopped += 1;
          originalStop(when);
          // A suspended context need not dispatch ended until resumed, but an
          // immediate stop has already silenced its disconnected source.
          if (!when && active) {
            active = false;
            probe.active -= 1;
          }
        };
        source.addEventListener('ended', () => {
          if (active) {
            active = false;
            probe.active -= 1;
          }
        });
        return source;
      };
      window.AudioContext = class extends Native {
        constructor(options?: AudioContextOptions) {
          super(options);
          probe.contexts += 1;
        }
        override createBufferSource() {
          const source = super.createBufferSource();
          observe(source, true);
          return source;
        }
        override createOscillator() {
          const source = super.createOscillator();
          observe(source, false);
          return source;
        }
        override decodeAudioData(bytes: ArrayBuffer) {
          return super.decodeAudioData(bytes).then((buffer) => {
            probe.decoded += 1;
            return buffer;
          });
        }
        override resume() {
          probe.resumes += 1;
          return super.resume();
        }
      };
      if (broken) {
        const originalFetch = window.fetch.bind(window);
        window.fetch = (input, init) =>
          String(input).includes('/sounds/')
            ? Promise.reject(new TypeError('Offline sound request'))
            : originalFetch(input, init);
      }
    },
    {
      progress: {
        ...initialProgress,
        name: 'Zola',
        onboarded: true,
        graphics: 'simple',
        sound: options.sound === true,
      },
      broken: options.broken === true,
    },
  );
  await page.goto('/');
  await page.getByRole('button', { name: 'Open settings' }).click();
}
const probe = (page: Page) => page.evaluate(() => window.tallyAudioProbe);

test('real sound exports decode after opt-in, share one context and stop on mute or hiding', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await start(page);
  expect((await probe(page)).contexts).toBe(0);
  await expect(page.getByRole('button', { name: 'Preview placement sound' })).toBeDisabled();
  await page.getByRole('button', { name: 'Test vibration' }).click();
  expect((await probe(page)).pulses).toContainEqual([12, 35, 12]);
  expect((await probe(page)).contexts).toBe(0);
  await page.getByRole('switch', { name: 'Sound effects' }).click();
  await expect.poll(async () => (await probe(page)).decoded).toBe(7);
  await page.getByRole('button', { name: 'Preview placement sound' }).click();
  await expect.poll(async () => (await probe(page)).samples).toBeGreaterThan(0);
  expect((await probe(page)).contexts).toBe(1);
  await page.getByRole('button', { name: 'Preview sounds', exact: true }).click();
  await expect.poll(async () => (await probe(page)).active).toBeGreaterThan(0);
  const before = (await probe(page)).stopped;
  await page.getByRole('switch', { name: 'Sound effects' }).click();
  await expect.poll(async () => (await probe(page)).active).toBe(0);
  expect((await probe(page)).stopped).toBeGreaterThan(before);
  await page.getByRole('switch', { name: 'Sound effects' }).click();
  await page.getByRole('button', { name: 'Preview sounds', exact: true }).click();
  await expect.poll(async () => (await probe(page)).active).toBeGreaterThan(0);
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect.poll(async () => (await probe(page)).active).toBe(0);
  const hidden = await probe(page);
  await page.evaluate(() => {
    document.querySelector<HTMLButtonElement>('[aria-label="Preview sounds"]')!.click();
    Object.defineProperty(document, 'hidden', { configurable: true, value: false });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.waitForTimeout(250);
  expect((await probe(page)).samples).toBe(hidden.samples);
  expect((await probe(page)).resumes).toBe(hidden.resumes);
  expect((await probe(page)).pulses.at(-1)).toBe(0);
  expect(errors).toEqual([]);
  await page.setViewportSize({ width: 320, height: 480 });
  expect(await page.getByRole('dialog').evaluate((e) => e.scrollWidth <= e.clientWidth + 1)).toBe(
    true,
  );
  expect(
    (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()).violations,
  ).toEqual([]);
});

test('haptics work with sound off, stop when disabled, and follow actual journal placement', async ({
  page,
}) => {
  await start(page);
  await page.getByRole('switch', { name: 'Haptic feedback' }).click();
  const count = (await probe(page)).pulses.length;
  await page.getByRole('button', { name: 'Close', exact: true }).click();
  await page.getByRole('button', { name: 'Practice', exact: true }).click();
  expect((await probe(page)).pulses.length).toBe(count);
  expect((await probe(page)).contexts).toBe(0);
  await page.getByRole('button', { name: 'Open settings' }).click();
  await page.getByRole('switch', { name: 'Haptic feedback' }).click();
  await page.getByRole('button', { name: 'Close', exact: true }).click();
  await page.goto('/?lesson=journal-lab');
  await page.getByRole('button', { name: 'I’m ready to try' }).click();
  await page.getByRole('button', { name: 'Equipment', exact: true }).click();
  // A deliberate second action gets its own placement pulse rather than click-rate suppression.
  await page.waitForTimeout(110);
  await page.getByRole('button', { name: 'Place account on debit', exact: true }).click();
  expect((await probe(page)).pulses.at(-1)).toBe(12);
  await expect(
    page.getByRole('button', { name: 'Place account on debit: Equipment', exact: true }),
  ).toBeVisible();
  expect((await probe(page)).contexts).toBe(0);
});

test('failed audio downloads and throwing vibration APIs never block a lesson', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await start(page, { sound: true, broken: true });
  await page.getByRole('button', { name: 'Preview sounds', exact: true }).click();
  await expect.poll(async () => (await probe(page)).tones).toBeGreaterThan(0);
  await page.getByRole('button', { name: 'Test vibration' }).click();
  await expect(
    page.getByRole('status').filter({ hasText: 'Vibration couldn’t start' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Close', exact: true }).click();
  await page.goto('/?lesson=equation');
  await page.getByRole('button', { name: 'I’m ready to try' }).click();
  await page.getByRole('button', { name: 'Asset', exact: true }).click();
  await expect(page.getByText('That’s it!', { exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test('offline reload retains sound choices and plays the locally cached exports', async ({
  page,
  context,
}) => {
  await start(page, { sound: true });
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  const cached = await page.evaluate(async () => {
    const cache = await caches.open('tally-offline-v11');
    return Promise.all(
      ['felt', 'tab', 'unfold', 'check', 'place', 'tally', 'bloom'].map(
        async (name) => !!(await cache.match(`/sounds/${name}-v1.mp3`)),
      ),
    );
  });
  expect(cached).toEqual(Array(7).fill(true));
  await context.setOffline(true);
  try {
    await page.reload();
    await page.getByRole('button', { name: 'Open settings' }).click();
    await expect(page.getByRole('switch', { name: 'Sound effects' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    await page.getByRole('button', { name: 'Preview selection sound' }).click();
    await expect.poll(async () => (await probe(page)).decoded).toBe(7);
    await page.getByRole('button', { name: 'Preview sounds', exact: true }).click();
    await expect.poll(async () => (await probe(page)).samples).toBeGreaterThan(0);
  } finally {
    await context.setOffline(false);
  }
});
