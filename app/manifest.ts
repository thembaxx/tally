import type { MetadataRoute } from 'next';
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'Tally — Make accounting click',
    short_name: 'Tally',
    description:
      'A patient little accounting tutor. Learn through playful 3D lessons at your pace.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    display_override: ['standalone', 'minimal-ui'],
    orientation: 'any',
    background_color: '#faf8f2',
    theme_color: '#faf8f2',
    categories: ['education', 'finance'],
    lang: 'en',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    screenshots: [
      {
        src: '/screenshots/home-mobile.png',
        sizes: '390x844',
        type: 'image/png',
        form_factor: 'narrow',
        label: 'Tally learning space',
      },
      {
        src: '/screenshots/home-desktop.png',
        sizes: '1440x1000',
        type: 'image/png',
        form_factor: 'wide',
        label: 'Tally learning dashboard',
      },
    ],
    shortcuts: [
      {
        name: 'Keep learning',
        short_name: 'Learn',
        url: '/?tab=learn',
        icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
      },
      {
        name: 'Daily practice',
        short_name: 'Practice',
        url: '/?tab=practice',
        icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
      },
    ],
  };
}
