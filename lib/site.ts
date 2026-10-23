/** The public origin stays stable across local builds and Vercel previews. */
export const siteUrl = new URL(
  process.env.NEXT_PUBLIC_SITE_URL || 'https://tally-wine-alpha.vercel.app',
).origin;

export const brand = {
  name: 'Tally',
  tagline: 'Make accounting click.',
  title: 'Tally — Learn accounting with interactive lessons',
  description:
    'Learn accounting at your pace with 15 free interactive lessons, 3D models and daily practice. Make debits, credits and financial statements click.',
  image: '/og.png',
  imageAlt: 'Tally. Make accounting click. Free, playful accounting lessons at your pace.',
};

export const isPreview = process.env.VERCEL_ENV === 'preview';
export const absoluteUrl = (path: string) => new URL(path, `${siteUrl}/`).href;

export function jsonLd(data: unknown) {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
