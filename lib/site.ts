/** The public origin stays stable across local builds and Vercel previews. */
export const siteUrl = new URL(
  process.env.NEXT_PUBLIC_SITE_URL || 'https://tally-wine-alpha.vercel.app',
).origin;

export const brand = {
  name: 'Tally',
  tagline: 'Make accounting click.',
  title: 'Tally — Learn accounting with interactive lessons',
  description:
    'Learn accounting with 16 free interactive lessons, South African rand examples and personalised practice. Explore debits, credits and financial statements.',
  image: '/og.png',
  imageAlt: 'Tally. Make accounting click. Free, playful accounting lessons at your pace.',
};

export const isPreview = process.env.VERCEL_ENV === 'preview';
export const absoluteUrl = (path: string) => new URL(path, `${siteUrl}/`).href;

export function jsonLd(data: unknown) {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
