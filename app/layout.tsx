import type { Metadata, Viewport } from 'next';
import './globals.css';
export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ||
      (process.env.VERCEL_PROJECT_PRODUCTION_URL
        ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
        : 'http://localhost:3000'),
  ),
  title: { default: 'Tally — A little learning. A lot of understanding.', template: '%s · Tally' },
  description:
    'Accounting, one lightbulb moment at a time. Learn with interactive 3D models, bite-sized lessons, daily challenges, and a patient little tutor. At your pace.',
  applicationName: 'Tally',
  keywords: [
    'learn accounting',
    'accounting for students',
    'interactive accounting',
    'microlearning',
    'debit and credit',
    'accounting equation',
  ],
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'Tally' },
  formatDetection: { telephone: false },
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180' }],
  },
  openGraph: {
    type: 'website',
    title: 'Tally — Make accounting click.',
    description:
      'Small lessons. Big lightbulb moments. An interactive accounting tutor for curious minds.',
    siteName: 'Tally',
    images: [
      {
        url: '/og.png',
        width: 1200,
        height: 630,
        alt: 'Tally — A little learning. A lot of understanding.',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tally — Make accounting click.',
    description: 'Learn accounting with interactive 3D lessons. A little better, every day.',
    images: ['/og.png'],
  },
  robots: { index: true, follow: true },
};
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#f8f7f3',
  colorScheme: 'light dark',
};
const themeScript = `try{let t=localStorage.getItem('tally-theme')||'system';let d=t==='dark'||(t==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.dataset.theme=d?'dark':'light';document.documentElement.style.colorScheme=d?'dark':'light';document.querySelector('meta[name="theme-color"]')?.setAttribute('content',d?'#181a1b':'#f8f7f3')}catch{}`;
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'EducationalApplication',
              name: 'Tally',
              applicationCategory: 'EducationalApplication',
              operatingSystem: 'Web',
              description:
                'Interactive, self-paced accounting lessons with 3D practice and daily challenges.',
              isAccessibleForFree: true,
              educationalLevel: ['Beginner', 'Intermediate'],
              offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
            }),
          }}
        />
      </body>
    </html>
  );
}
