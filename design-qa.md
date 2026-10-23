# Tally brand, discovery and learning studio QA

**final result: passed**

The revised design and learning interactions passed visual review and the complete production regression suite. No actionable P0/P1/P2 findings remain in this scope.

## Visual grounding and evidence

The latest user references show colorful app marks, soft dimensional folds, and a flowing blue/orange/pink ribbon. They informed a new, original folded-ribbon Tally mark and a more expressive palette. Earlier mobile references continue to inform the floating navigation, sheets, whitespace, and achievement shapes. The user explicitly asked to rethink the palette, so the previous warm muted design is the before state rather than a fidelity target.

- Before: `f9069b5:public/screenshots/home-mobile.png` (390 × 844, density 1).
- Direct side-by-side comparison: `/workspace/scratch/tally-before-after.png`, with the before and after viewport images normalized to 390 × 844 and placed together.
- After: `public/screenshots/home-mobile.png` (390 × 844, density 1) and `public/screenshots/home-desktop.png` (1440 × 1000, density 1).
- Full-page captures: `/workspace/scratch/revision-home-qa.png`, `/workspace/scratch/revision-practice-qa.png`, `/workspace/scratch/revision-learn-qa.png`, and `/workspace/scratch/revision-dark-home.png`.
- Focused lesson captures: `/workspace/scratch/recall-front-modal.png`, `/workspace/scratch/recall-back-card.png`, and `/workspace/scratch/journal-top-modal.png`.
- Committed visual baseline: `tests/studio.spec.ts-snapshots/recall-answer-linux.png`.

Captures are app content in Chromium, without simulated device chrome. Scroll entrances were exercised before full-page captures. The production PWA screenshots use actual viewport captures.

## Required surfaces

- **Typography:** Outfit display text, DM Sans body text, DM Mono values. The hero stays within three lines. Lesson instructions use readable paragraphs; long titles wrap.
- **Layout:** the four-item navigation is preserved. The library uses two columns with the final odd card spanning the full row. A four-tile practice studio offers distinct formats. Sheets scroll within the viewport and reset to the beginning for each lesson stage.
- **Color:** cobalt provides actions and progress; apricot, lilac, mint, and lemon distinguish learning formats and feedback. The light theme uses warm cream; dark uses navy. Browser and install metadata use the same background colors. Automated contrast checks were run after transitions settled.
- **Assets:** the original generated ribbon mark is used in navigation, loading, favicon, install and maskable icons, and the Open Graph image. The live 3D scale and comparison objects use refreshed complementary materials. The recall card has two real 3D faces.
- **Copy:** 15 authored lessons include complete examples, feedback, hints, and reflection. Four new formats teach through action, recall, review, and scenario decisions. Follow the Cash is playable, not a placeholder. There is no professional mastery certification claim.

## Findings, fixes, and comparison history

1. Small format labels had insufficient contrast. Set their foreground to the shared high-contrast text token. Rechecked Home, Learn, Practice, Me, and Settings, plus the reduced-motion lesson state.
2. A lesson sheet retained its scroll position when moving from a long introduction into practice. Reset the sheet and focus the new heading, while respecting a learner who has already begun interacting. The journal task capture confirms scrollTop 0.
3. Filtering the lesson library could keep a chapter transparent because ScrollTrigger retained its old position. Recreate scoped triggers when the filter changes; the dedicated filter test checks visible opacity and chapter counts.
4. The recall flip initially showed a mirrored front face. The card’s isolation property flattened the 3D context. Removed that property, verified the readable answer face, and committed a visual regression baseline.
5. Dialog dismissal did not reliably restore focus to the launching control. Capture the opener and restore focus after close, including the nested settings flows.

## Validation and limits

All 14 production-build Playwright tests passed in 3.2 minutes, including the committed visual baseline. TypeScript, oxlint, oxfmt, and the optimized Next.js build passed. After a fresh online visit, a disconnected reload opened the new recall lesson, displayed its answer, preserved 120 XP and existing completed lessons, and used only the v2 offline cache. No page errors were observed.

Targeted browser tests cover complete journal, recall, detective, and cash-flow story lessons, wrong-answer feedback, uncertain-card requeueing, filter changes, keyboard access, focus restoration, and the 3D answer face. Existing lesson, XP, theme, daily mix, navigation, focus timer, and persistence tests remain in the regression suite.

Automated axe A/AA checks reported no violations on the four main screens in light mode, Home and Settings in dark mode, and the reduced-motion detective exercise. Page errors were checked during visual reviews and none were observed.

Physical Safari/iOS/Android hardware was not available. Native haptics and installation remain browser-dependent; keyboard and tap alternatives are available. Progress stays on the device, and the tutor uses authored content rather than generative chat.

## SEO and branding revision — October 23, 2026

**final result: passed**

The latest attached references show rounded, colorful productivity and native app icons. The new original layered t keeps that simple silhouette and restrained depth, with a cobalt stem, apricot/gold ribbon, coral end and violet overlap. It replaces the previous more rounded render. Existing app layout, lesson behavior and interface palette remain the grounding for the integration.

Visual evidence reviewed directly:

- Generated source: `/workspace/generated_images/exec-56c6dcf2-e450-4eec-bcf9-bdbd205d135f.png`.
- Transparent normalized master: `public/brand/logo-1024.png`.
- Actual revised mobile app: `public/screenshots/home-mobile.png` (390 × 844); desktop: `public/screenshots/home-desktop.png` (1440 × 1000).
- Full public shelf captures: `/workspace/scratch/tally-seo-shelf-mobile.png` and `/workspace/scratch/tally-seo-shelf-desktop.png`.
- Full lesson guide captures: `/workspace/scratch/tally-seo-equation-mobile.png` and `/workspace/scratch/tally-seo-equation-desktop.png`.
- Social card: `public/og.png` (1200 × 630); the 32 px favicon was also opened and inspected at its actual resolution.

The public shelf and article match the existing visual system: Outfit hierarchy, DM Sans reading text, DM Mono values, quiet paper surfaces, colored lesson cards, rounded controls and generous whitespace. Guides keep the authored teaching material readable and provide a direct route into the matching interactive lesson. The new logo remains distinct at small size; all app assets and social sharing use the same symbol and wordmark treatment. `public/brand/brand-guide.md` and the downloadable kit document its use.

One P1 was found and fixed: the shared root loading boundary left public guides hidden without JavaScript. Moving the interactive app and its loading boundary into `app/(app)/` makes guide content and links directly readable without scripts. No actionable P0/P1/P2 issues remain in this scope.

Validation:

- All **18** production-build Playwright tests passed in **3.4 minutes**, including all 14 existing learning regressions and four new discovery/guide tests.
- All 17 canonical URLs, 15 lesson-resource graphs, breadcrumbs, text-file parity, full-reference explanations and all links in the LLM overview passed checks. Unknown guide slugs return 404.
- No-JavaScript shelf → guide → explanation navigation passed. A guide opened the correct journal lesson after onboarding; a returning learner opened Cash Flow with existing XP intact.
- Shelf and guide passed overflow checks at 320, 390, 768 and 1440 px, and axe WCAG A/AA checks in both light and dark themes.
- TypeScript, oxlint, oxfmt and the optimized Next.js build passed. JSON-LD parses successfully and uses valid Schema.org types; search-engine rich-result eligibility is not asserted.
- Offline reload opened the new recall lesson, displayed its answer, retained 120 XP and used only `tally-offline-v3`; no page errors were observed.
- Icon dimensions and social-card dimensions match metadata. A pixel check found **zero** non-background pixels outside the maskable icon's central safe-area circle.

Search ranking, actual indexing and AI citation outcomes were not measured. The asset/reference photographs are inspiration for the original logo, not a pixel-fidelity target for the entire app.
