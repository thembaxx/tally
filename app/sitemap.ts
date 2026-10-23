import type { MetadataRoute } from 'next';
import { lessons } from '@/lib/learning';
import { absoluteUrl } from '@/lib/site';
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: absoluteUrl('/'), changeFrequency: 'monthly', priority: 1 },
    { url: absoluteUrl('/learn'), changeFrequency: 'monthly', priority: 0.9 },
    ...lessons
      .filter((lesson) => !lesson.locked)
      .map((lesson) => ({
        url: absoluteUrl(`/learn/${lesson.id}`),
        changeFrequency: 'monthly' as const,
        priority: 0.8,
      })),
  ];
}
