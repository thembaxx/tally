import { test, expect, type BrowserContext, type Page } from '@playwright/test';
import { initialProgress } from '../lib/learning';
import { createCode, accessToken, seal, unseal, fingerprint } from '../lib/vault';
import { GET, HEAD, POST, PUT } from '../app/api/sync/route';
test('running sync endpoint answers GET and HEAD without exposing progress or caching it', async ({
  request,
}) => {
  const get = await request.get('/api/sync');
  const head = await request.head('/api/sync');
  expect(get.status()).toBe(200);
  expect(typeof (await get.json()).configured).toBe('boolean');
  expect(head.status()).toBe(get.status());
  expect(await head.text()).toBe('');
  expect(head.headers()['cache-control']).toContain('no-store');
  expect(head.headers()['x-robots-tag']).toContain('noindex');
});
test('sync API rejects invalid capabilities, origins and payloads, and uses revision checks without caching', async () => {
  const beforeUrl = process.env.TALLY_SYNC_URL;
  const beforeKey = process.env.TALLY_SYNC_PUBLISHABLE_KEY;
  const originalFetch = globalThis.fetch;
  process.env.TALLY_SYNC_URL = 'https://example.supabase.co';
  process.env.TALLY_SYNC_PUBLISHABLE_KEY = 'test-publishable-key';
  try {
    const status = await GET(new Request('https://tally.test/api/sync'));
    expect(await status.json()).toEqual({ configured: true });
    expect(status.headers.get('Cache-Control')).toContain('no-store');
    const head = await HEAD(new Request('https://tally.test/api/sync', { method: 'HEAD' }));
    expect(head.status).toBe(status.status);
    expect(await head.text()).toBe('');
    expect(
      (
        await GET(
          new Request('https://tally.test/api/sync', {
            headers: { authorization: 'Bearer not-a-capability' },
          }),
        )
      ).status,
    ).toBe(401);
    const auth = { authorization: `Bearer ${'a'.repeat(64)}`, 'content-type': 'application/json' };
    expect(
      (
        await POST(
          new Request('https://tally.test/api/sync', {
            method: 'POST',
            headers: { ...auth, origin: 'https://other.test' },
            body: '{}',
          }),
        )
      ).status,
    ).toBe(403);
    for (const body of [
      'null',
      '{}',
      JSON.stringify({ revision: crypto.randomUUID(), payload: { iv: 'bad', ciphertext: 'bad' } }),
    ])
      expect(
        (
          await POST(
            new Request('https://tally.test/api/sync', { method: 'POST', headers: auth, body }),
          )
        ).status,
      ).toBe(400);
    let called = false;
    globalThis.fetch = (async (url: URL | RequestInfo, init?: RequestInit) => {
      called = true;
      const u = new URL(String(url));
      expect(u.searchParams.get('id')).toMatch(/^eq\.[a-f0-9]{64}$/);
      expect(u.searchParams.get('id')).not.toBe(`eq.${'a'.repeat(64)}`);
      expect(u.searchParams.get('revision')).toBe(`eq.${expected}`);
      expect(init?.method).toBe('PATCH');
      return Response.json([]);
    }) as typeof fetch;
    const expected = crypto.randomUUID();
    const response = await PUT(
      new Request('https://tally.test/api/sync', {
        method: 'PUT',
        headers: auth,
        body: JSON.stringify({
          expected,
          revision: crypto.randomUUID(),
          payload: { iv: 'AAAAAAAAAAAAAAAA', ciphertext: 'A'.repeat(24) },
        }),
      }),
    );
    expect(called).toBe(true);
    expect(response.status).toBe(409);
  } finally {
    globalThis.fetch = originalFetch;
    if (beforeUrl === undefined) delete process.env.TALLY_SYNC_URL;
    else process.env.TALLY_SYNC_URL = beforeUrl;
    if (beforeKey === undefined) delete process.env.TALLY_SYNC_PUBLISHABLE_KEY;
    else process.env.TALLY_SYNC_PUBLISHABLE_KEY = beforeKey;
  }
});
test('vault encryption authenticates data, uses fresh nonces and keeps the access capability separate', async () => {
  const code = createCode();
  const p = {
    ...initialProgress,
    name: 'Private learner',
    notes: { debit: 'My private reflection' },
  };
  const first = await seal(p, code);
  const second = await seal(p, code);
  expect(first.iv).not.toBe(second.iv);
  expect(first.ciphertext).not.toContain('Private learner');
  expect(first.ciphertext).not.toContain('My private reflection');
  expect(await unseal(first, code)).toMatchObject({ name: 'Private learner', notes: p.notes });
  await expect(unseal(first, createCode())).rejects.toThrow('could not unlock');
  const corrupted = {
    ...first,
    ciphertext: (first.ciphertext[0] === 'A' ? 'B' : 'A') + first.ciphertext.slice(1),
  };
  await expect(unseal(corrupted, code)).rejects.toThrow('could not unlock');
  expect(await accessToken(code)).not.toBe(code.replace('tally-', ''));
  expect(fingerprint({ ...p, theme: 'dark', sound: true, graphics: 'simple' })).toBe(
    fingerprint(p),
  );
});
type Record = { revision: string; payload: { iv: string; ciphertext: string } };
async function seed(context: BrowserContext, name: string, xp: number) {
  await context.addInitScript(
    (p) => {
      HTMLCanvasElement.prototype.getContext = () => null;
      if (!localStorage.getItem('tally-progress-v1'))
        localStorage.setItem('tally-progress-v1', JSON.stringify(p));
    },
    { ...initialProgress, onboarded: true, name, xp },
  );
}
async function settings(page: Page) {
  await page.goto('/');
  const sidebar = page.locator('.sidebar-settings');
  if (await sidebar.isVisible()) await sidebar.click();
  else await page.getByRole('button', { name: 'Open settings', exact: true }).click();
}
test('two devices connect with encrypted progress, review conflicts, retain preferences and reconnect after offline changes', async ({
  browser,
}) => {
  const devices = await Promise.all([
    browser.newContext({
      baseURL: process.env.BASE_URL || 'http://localhost:3000',
      viewport: { width: 390, height: 844 },
      reducedMotion: 'reduce',
      serviceWorkers: 'block',
    }),
    browser.newContext({
      baseURL: process.env.BASE_URL || 'http://localhost:3000',
      viewport: { width: 1280, height: 900 },
      reducedMotion: 'reduce',
      serviceWorkers: 'block',
    }),
  ]);
  for (const device of devices) {
    device.setDefaultTimeout(12000);
    device.setDefaultNavigationTimeout(12000);
  }
  const vaults = new Map<string, Record>();
  let raceNextWrite = false;
  for (const context of devices)
    await context.route('**/api/sync', async (route) => {
      const req = route.request();
      const token = req.headers().authorization || '';
      const method = req.method();
      if (method === 'GET' && !token)
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ configured: true }),
        });
      if (method === 'POST') {
        if (vaults.has(token)) return route.fulfill({ status: 409 });
        const data = req.postDataJSON();
        vaults.set(token, { revision: data.revision, payload: data.payload });
      }
      if (method === 'PUT') {
        const data = req.postDataJSON();
        if (raceNextWrite) {
          raceNextWrite = false;
          const old = vaults.get(token)!;
          vaults.set(token, { ...old, revision: crypto.randomUUID() });
          return route.fulfill({ status: 409 });
        }
        if (vaults.get(token)?.revision !== data.expected) return route.fulfill({ status: 409 });
        vaults.set(token, { revision: data.revision, payload: data.payload });
      }
      if (method === 'DELETE') {
        vaults.delete(token);
        return route.fulfill({ status: 204 });
      }
      return route.fulfill({
        status: vaults.has(token) ? 200 : 404,
        contentType: 'application/json',
        body: JSON.stringify(vaults.get(token) || {}),
      });
    });
  try {
    await seed(devices[0], 'Phone learner', 100);
    await seed(devices[1], 'Computer learner', 20);
    const phone = await devices[0].newPage();
    const computer = await devices[1].newPage();
    await settings(phone);
    await phone.getByRole('button', { name: 'Enable progress sync', exact: true }).click();
    await phone.getByRole('button', { name: 'Connect another device', exact: true }).click();
    const code = await phone.locator('.sync-code').innerText();
    expect(vaults.size).toBe(1);
    expect(JSON.stringify([...vaults.values()])).not.toContain('Phone learner');
    await settings(computer);
    await computer.getByRole('button', { name: 'Dark', exact: true }).click();
    await computer.getByText('I have a sync key', { exact: true }).click();
    await computer.getByLabel('Private sync key', { exact: true }).fill(code);
    await computer.getByRole('button', { name: 'Find my progress', exact: true }).click();
    await expect(computer.getByRole('region', { name: 'Choose progress to sync' })).toContainText(
      '100 XP',
    );
    await computer.getByRole('button', { name: 'Use cloud progress', exact: true }).click();
    await expect(computer.getByLabel('Your name', { exact: true })).toHaveValue('Phone learner');
    await expect(computer.locator('html')).toHaveAttribute('data-theme', 'dark');
    const backup = await computer.evaluate(() =>
      JSON.parse(localStorage.getItem('tally-before-sync-v1') || '{}'),
    );
    expect(backup.progress.name).toBe('Computer learner');
    raceNextWrite = true;
    await phone.getByLabel('Your name', { exact: true }).fill('Phone changed');
    await phone.getByRole('button', { name: 'Sync now', exact: true }).click();
    await expect(phone.getByRole('region', { name: 'Choose progress to sync' })).toBeVisible();
    await phone.getByRole('button', { name: 'Use this device on both', exact: true }).click();
    await computer.getByLabel('Your name', { exact: true }).fill('Computer changed');
    const review = computer.getByRole('region', { name: 'Choose progress to sync' });
    if (!(await review.isVisible())) {
      await computer
        .getByRole('button', { name: 'Sync now', exact: true })
        .click({ timeout: 1000 })
        .catch(async () => {
          await expect(review).toBeVisible();
        });
    }
    await expect(computer.getByRole('region', { name: 'Choose progress to sync' })).toBeVisible();
    await expect(computer.getByLabel('Your name', { exact: true })).toHaveValue('Computer changed');
    await computer.getByRole('button', { name: 'Use cloud progress', exact: true }).click();
    await expect(computer.getByLabel('Your name', { exact: true })).toHaveValue('Phone changed');
    await devices[1].setOffline(true);
    await computer.getByLabel('Your name', { exact: true }).fill('Offline change');
    await computer.getByRole('button', { name: 'Sync now', exact: true }).click();
    await expect(computer.locator('.sync-panel')).toContainText('Offline. Your changes stay');
    await devices[1].setOffline(false);
    await expect(computer.locator('.sync-panel')).toContainText('Up to date');
    const record = [...vaults.values()][0];
    expect((await unseal(record.payload, code)).name).toBe('Offline change');
    await computer.getByRole('button', { name: 'Delete cloud copy', exact: true }).click();
    await computer
      .getByRole('button', { name: 'Delete encrypted cloud copy', exact: true })
      .click();
    await expect(computer.locator('.sync-panel')).toContainText('Cloud copy deleted');
    expect(vaults.size).toBe(0);
    await expect(computer.getByLabel('Your name', { exact: true })).toHaveValue('Offline change');
  } finally {
    await Promise.allSettled(devices.map((c) => c.close()));
  }
});
