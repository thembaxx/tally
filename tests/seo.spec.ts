import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { initialProgress, lessons } from '../lib/learning';
import { absoluteUrl, brand, siteUrl } from '../lib/site';
import { guideTitle } from '../lib/guides';

test('canonical pages, structured data, robots, sitemap and LLM files agree', async ({
  request,
}) => {
  const home = await request.get('/?tab=practice');
  expect(home.ok()).toBe(true);
  const homeHtml = await home.text();
  const canonical = homeHtml.match(/<link rel="canonical" href="([^"]+)"/);
  expect(new URL(canonical![1]).href).toBe(absoluteUrl('/'));
  expect(homeHtml).toContain('"@type":"WebApplication"');
  expect(homeHtml).toContain('href="/learn"');
  expect(homeHtml).toContain(brand.title);
  const structuredData = (html: string) =>
    [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
      .map((match) => JSON.parse(match[1]))
      .flatMap((data) => data['@graph'] || [data]);
  expect(structuredData(homeHtml).find((data) => data['@type'] === 'WebApplication').url).toBe(
    absoluteUrl('/'),
  );
  const robots = await (await request.get('/robots.txt')).text();
  expect(robots).toContain('User-Agent: *');
  expect(robots).toContain('Allow: /');
  expect(robots).toContain(`Sitemap: ${absoluteUrl('/sitemap.xml')}`);
  const sitemap = await (await request.get('/sitemap.xml')).text();
  const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
  expect(urls).toHaveLength(18);
  expect(urls.every((url) => url.startsWith(siteUrl) && !url.includes('?'))).toBe(true);
  const response = await request.get('/llms.txt');
  expect(response.headers()['content-type']).toContain('text/plain');
  const reference = await response.text();
  expect(await (await request.get('/llm.txt')).text()).toBe(reference);
  const full = await (await request.get('/llms-full.txt')).text();
  for (const lesson of lessons) {
    const path = `/learn/${lesson.id}`;
    const guide = await request.get(path);
    expect(guide.status(), path).toBe(200);
    const html = await guide.text();
    expect(html, path).toContain(`<link rel="canonical" href="${absoluteUrl(path)}"`);
    expect(html, path).toContain('LearningResource');
    expect(html, path).toContain('BreadcrumbList');
    const resource = structuredData(html).find((data) => data['@type'] === 'LearningResource');
    expect(resource.url).toBe(absoluteUrl(path));
    expect(resource.description).toBe(lesson.concept);
    expect(html, path).toContain(`<h1>${guideTitle(lesson).replace(/&/g, '&amp;')}</h1>`);
    expect(urls).toContain(absoluteUrl(path));
    expect(reference).toContain(absoluteUrl(path));
    expect(full).toContain(lesson.concept);
    expect(full).toContain(lesson.entry.explanation);
  }
  for (const match of reference.matchAll(/\]\((https?:[^)]+)\)/g)) {
    const link = new URL(match[1]);
    const result = await request.get(link.pathname + link.search);
    expect(result.ok(), link.pathname).toBe(true);
  }
  expect((await request.get('/learn/not-a-lesson')).status()).toBe(404);
});

test('public guides work without JavaScript and have readable responsive themes', async ({
  browser,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  await page.goto('/learn');
  await expect(page.locator('.guide-card')).toHaveCount(16);
  await page.getByRole('link', { name: /The accounting equation: assets/ }).click();
  await expect(page.locator('h1')).toHaveText(guideTitle(lessons[0]));
  await expect(page.getByText(lessons[0].example, { exact: true })).toBeVisible();
  await page.getByText('Think it through, then reveal the explanation', { exact: true }).click();
  await expect(page.locator('details')).toContainText(lessons[0].entry.explanation);
  await context.close();
});

test('guide navigation opens practice immediately and preserves progress', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/learn/journal-lab');
  await page.getByRole('link', { name: 'Try the interactive lesson' }).click();
  await expect(page.getByLabel('What should I call you?')).toHaveCount(0);
  await expect(page.getByRole('dialog').locator('.lesson-player h2').first()).toHaveText(
    'The Journal Lab',
  );
  await page.getByRole('button', { name: 'Close', exact: true }).click();
  await page
    .getByRole('navigation', { name: 'Main navigation' })
    .getByRole('button', { name: 'Home', exact: true })
    .click();
  await expect(page).not.toHaveURL(/lesson=/);
  await page.evaluate(
    (progress) => localStorage.setItem('tally-progress-v1', JSON.stringify(progress)),
    { ...initialProgress, onboarded: true, xp: 120, completed: ['equation'] },
  );
  await page.goto('/?lesson=cashflow');
  await expect(page.getByRole('dialog').locator('.lesson-player h2').first()).toHaveText(
    'Follow the Cash',
  );
  await expect(page.locator('.xp-chip')).toContainText('120');
  expect(errors).toEqual([]);
});

test('guide layouts and branding assets pass responsive and accessibility checks', async ({
  page,
  request,
}) => {
  for (const route of ['/learn', '/learn/equation']) {
    await page.goto(route);
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        `${route} at ${width}`,
      ).toBe(true);
    }
    for (const theme of ['light', 'dark']) {
      await page.evaluate((value) => (document.documentElement.dataset.theme = value), theme);
      await page.waitForTimeout(350);
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();
      expect(
        results.violations.map((item) => ({
          id: item.id,
          nodes: item.nodes.map((node) => node.target),
        })),
        `${route} ${theme}`,
      ).toEqual([]);
    }
  }
  const manifest = await (await request.get('/manifest.webmanifest')).json();
  for (const icon of manifest.icons) expect((await request.get(icon.src)).ok()).toBe(true);
  for (const asset of [
    '/brand-mark.webp',
    '/og.png',
    '/brand/logo-1024.png',
    '/brand/brand-guide.md',
  ])
    expect((await request.get(asset)).ok()).toBe(true);
});
