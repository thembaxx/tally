# Tally discovery and branding

## Scope and observed gaps

Inspected the live homepage at https://tally-wine-alpha.vercel.app on October 23, 2026 with Firecrawl (`markdown`, `rawHtml`, `links`, `maxAge: 0`). The page returned HTTP 200. Its actual head contained a title, description, Open Graph/Twitter metadata and index/follow instructions, but no canonical URL or `og:url`. The only discovered anchor was `#main`; the lesson library was reachable through JavaScript buttons. The local robots source had no sitemap directive, and the sitemap listed only the homepage. Both static LLM files were separate copies with relative links.

This was a technical/content discovery sample, not a measurement of ranking, traffic, search-engine indexing, backlink quality or Core Web Vitals.

## Implementation

- `lib/site.ts` owns the canonical public origin and primary brand copy. Production defaults to the current primary alias, not a random preview hostname or localhost.
- Home and app query variants declare the homepage canonical. App tabs are views, not separate search landing pages.
- `/learn` links to all 15 authored lesson guides. `/learn/[slug]` is statically generated, with unique titles/descriptions, self-canonicals, visible examples, explanations and related-guide links. Unknown slugs return 404.
- Public guide HTML is readable without JavaScript. The interactive app retains its own loading boundary in `app/(app)/`; it does not hide public guides behind a streamed loading screen.
- Public guides launch the exact lesson with `/?lesson=<id>`. New learners still receive onboarding. Existing progress is preserved.
- Structured data describes Organization, WebSite, the educational web application, CollectionPage/ItemList, LearningResource and BreadcrumbList. Claims match visible content; there are no fabricated ratings or accreditations.
- The app uses the valid Schema.org `WebApplication` type with `applicationCategory: EducationalApplication`. The former `@type: EducationalApplication` was not a defined Schema.org type (the official type URL returned 404; `SoftwareApplication` returned 200).
- `robots.txt` permits crawlers and advertises the canonical sitemap. The sitemap includes only Home, the guide shelf and 15 guide URLs, with no query variants or invented modification dates.
- Vercel preview builds emit `noindex, follow` in page metadata and `X-Robots-Tag`. Crawling remains allowed so crawlers can read that directive.
- `/llms.txt` is the primary concise reference; `/llm.txt` serves the same text. `/llms-full.txt` contains the complete concept/example/tip/check explanations. All use absolute canonical links and derive the curriculum from the lesson source.
- The public reference distinguishes the authored tutor from an AI chatbot, accounting education from bookkeeping, introductory advanced topics from professional certification, and device-local progress from cloud sync.
- Root metadata advertises the text reference with an alternate link. This is a discovery hint, not a recognized ranking signal or a crawler access policy.

## Brand system

The refreshed original t symbol uses cobalt, golden apricot, coral and a violet overlap, informed by the supplied rounded app-icon references. The same mark appears in the app, favicon, Apple/PWA icons, social card and organization metadata. The wordmark is `tally.`; the name in prose is Tally; the primary tagline is “Make accounting click.”

`public/brand/brand-guide.md` documents the interface palette, dark-theme counterparts, font roles, voice, clear space, minimum sizes, asset provenance and motion principles. `public/brand/logo-1024.png` is the transparent master. The maskable icon is deliberately smaller than the standard icon to fit every mask safely.

## Verification and operational notes

Run the production build and `tests/seo.spec.ts` against it. The suite checks all 17 canonical pages, guide schema presence, all LLM reference links, text-file parity, 404 behavior, no-JavaScript guide navigation, onboarding/deep links, unchanged progress, responsive widths and axe A/AA checks in light and dark. Existing learning tests cover the app regression flows. Syntax/shape checks do not establish eligibility for a Google rich result.

After deployment, fetch `/robots.txt`, `/sitemap.xml`, `/llms.txt`, `/llm.txt` and `/llms-full.txt`; inspect head markup and parsed JSON-LD on Home and a guide; verify that previews carry noindex while the primary deployment does not.

For a future custom domain: connect and redirect aliases in Vercel, set `NEXT_PUBLIC_SITE_URL` to the primary HTTPS origin in all build environments, redeploy, and verify canonical/OG/sitemap/LLM links. A verified owner can submit the sitemap in Google Search Console and Bing Webmaster Tools, then monitor reported indexing. No search-console ownership, indexing status or AI citation measurements are available in this workspace.
