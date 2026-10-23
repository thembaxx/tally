import TallyApp from '@/components/tally-app';
import { absoluteUrl, brand, jsonLd } from '@/lib/site';
export default function Home() {
  return (
    <>
      <TallyApp />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd({
            '@context': 'https://schema.org',
            '@type': 'WebApplication',
            '@id': absoluteUrl('/#app'),
            name: brand.name,
            url: absoluteUrl('/'),
            description: brand.description,
            image: absoluteUrl(brand.image),
            applicationCategory: 'EducationalApplication',
            operatingSystem: 'Any',
            browserRequirements: 'A modern web browser. WebGL is optional.',
            isAccessibleForFree: true,
            inLanguage: 'en',
            educationalLevel: ['Beginner', 'Intermediate', 'Introductions to advanced topics'],
            featureList: [
              'Interactive accounting lessons',
              '3D illustrations',
              'Daily practice',
              'Offline learning',
            ],
            publisher: { '@id': absoluteUrl('/#organization') },
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          }),
        }}
      />
    </>
  );
}
