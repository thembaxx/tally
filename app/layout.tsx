import type { Metadata, Viewport } from 'next';
import { absoluteUrl, brand, isPreview, jsonLd, siteUrl } from '@/lib/site';
import './globals.css';
import './expressive.css';
import './guides.css';
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: brand.title, template: '%s · Tally' },
  description: brand.description,
  applicationName: brand.name,
  alternates: { canonical: '/' },
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'Tally' },
  formatDetection: { telephone: false },
  icons: {
    icon: [
      { url: '/icons/icon-32.png', type: 'image/png', sizes: '32x32' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180' }],
  },
  openGraph: {
    type: 'website',
    url: '/',
    title: brand.title,
    description: brand.description,
    siteName: brand.name,
    locale: 'en_US',
    images: [
      {
        url: brand.image,
        width: 1200,
        height: 630,
        alt: brand.imageAlt,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: brand.title,
    description: brand.description,
    images: [{ url: brand.image, alt: brand.imageAlt }],
  },
  robots: {
    index: !isPreview,
    follow: true,
    googleBot: { index: !isPreview, follow: true, 'max-image-preview': 'large' },
  },
};
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#faf8f2',
  colorScheme: 'light dark',
};
const themeScript = `try{let t=localStorage.getItem('tally-theme')||'system';let d=t==='dark'||(t==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.dataset.theme=d?'dark':'light';document.documentElement.style.colorScheme=d?'dark':'light';document.querySelector('meta[name="theme-color"]')?.setAttribute('content',d?'#111524':'#faf8f2')}catch{}`;
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <link
          rel="alternate"
          type="text/plain"
          href="/llms.txt"
          title="Tally for language models"
        />
      </head>
      <body>
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: jsonLd({
              '@context': 'https://schema.org',
              '@graph': [
                {
                  '@type': 'Organization',
                  '@id': absoluteUrl('/#organization'),
                  name: brand.name,
                  url: absoluteUrl('/'),
                  slogan: brand.tagline,
                  logo: {
                    '@type': 'ImageObject',
                    url: absoluteUrl('/icons/icon-512.png'),
                    width: 512,
                    height: 512,
                  },
                  description: 'Tally is a free, self-paced accounting learning app.',
                },
                {
                  '@type': 'WebSite',
                  '@id': absoluteUrl('/#website'),
                  name: brand.name,
                  url: absoluteUrl('/'),
                  description: brand.description,
                  inLanguage: 'en',
                  publisher: { '@id': absoluteUrl('/#organization') },
                },
              ],
            }),
          }}
        />
      </body>
    </html>
  );
}
