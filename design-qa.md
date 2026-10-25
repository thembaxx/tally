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

## Gesture revision — October 23, 2026

**final result: passed**

The existing Tally visual system and learning flow remain the reference. This revision improves touch ownership, direct feedback, scroll cooperation and equivalent tap/keyboard controls.

- Sort cards follow the pointer and show a direction label before release. Left/right/up map to Asset/Liability/Equity. Small or diagonal movements, cancellation, lost capture and a second pointer never submit an answer.
- Journal chips use pointer capture on touch and mouse, with a floating label, highlighted drop zone, edge scrolling and a polite placement announcement. Canceled/outside drops restore the selection from before the drag.
- Recall cards support horizontal swipe-to-flip. Vertical swipes scroll, and confidence ratings still require an explicit choice. Generated clicks after a drag cannot undo the action; a fresh tap remains immediately available.
- The mobile sheet handle has a 44 px target, direct pull feedback and short-pull rebound. Long downward pulls dismiss the sheet and restore focus. Only the handle owns dismissal, leaving lesson inputs and other gestures alone.
- Reordering retains its drag handle and arrow alternatives, adds edge scrolling, and removes release momentum. Coarse-pointer targets are enlarged.
- 3D scenes use sideways rotation and two-finger dolly/rotation. Vertical swipes and ordinary wheel events scroll their containing page or sheet. Explicit zoom directions are corrected; reset restores the camera and target; auto-rotation stops after interaction.
- Home and Practice use an expandable compact view toolbar to keep the main action clear. Exercise scenes expose rotate, zoom and reset controls directly. Numerical view updates are also available to assistive technology.

Visual evidence opened and reviewed: `public/screenshots/home-mobile.png` (390 × 844, actual touch context), `public/screenshots/home-desktop.png` (1440 × 1000), `/workspace/scratch/gesture-journal-drag.png`, `/workspace/scratch/gesture-journal-placed.png`, and `/workspace/scratch/gesture-desktop-settings.png`. The mobile drag captures show the floating chip, highlighted destination and placed account. The desktop settings sheet remains centered and scrollable. The compact toolbar keeps large touch targets without covering the learning action.

All **26** production-build Playwright tests passed in **4.5 minutes**. Eight new Chromium touch-input cases exercise sorting previews and all directions, cancel/diagonal/multi-touch protection, journal touch drop and cancellation, edge scrolling, recall swipe and vertical scrolling, sheet dismissal/focus, 3D drag/pinch/zoom/reset/scroll cooperation and compact controls, plus touch reordering and axe A/AA checks. The other 18 learning, theme, focus, SEO and visual regression tests also passed. This includes the existing readable 3D card-flip baseline.

TypeScript, oxlint, oxfmt and the optimized build passed. An offline reload opened the recall lesson and its answer, preserved 120 XP and existing progress, and used only `tally-offline-v4`; capture and offline checks observed no page errors. The shared pointer hook removes capture and document listeners on completion, cancellation, blur, hidden tabs and unmount. Motion values handle transient movement; reduced motion suppresses rebound/flip animation.

Physical iOS/Android and pen hardware were not available. Browser touch-input emulation verifies gesture routing and multi-touch behavior, not device-specific haptics or operating-system edge gestures. No P0/P1/P2 issues remain in this scope.

### Integration with current main — October 25, 2026

The release incorporates main `da58dc4`, preserving all 16 lessons, adaptive question plans, session recovery, skill stages, the opt-in soundscape, settings separation, South African English, rand and SAST calendars. Gesture tests use the adaptive question source for entry answers. The offline cache advances from main's v7 to v8; it does not revert to the earlier gesture build's v4. PWA captures were refreshed from the integrated app, and journal drag captures show rand and trade-payables terminology.

All eight touch scenarios passed again after integration. TypeScript, oxlint, oxfmt and the production build passed. The expanded 55-case suite is the release regression suite; its final result is recorded in the pull request's Verify app check. The 26-case result above documents the earlier gesture-only build before main advanced.

## Business sandbox and tutor revision — October 25, 2026

Browser verification passed. Hosted sync activation and physical-device checks remain separate work with the requirements below.

- Practice adds a persistent 3D tuck shop and three checkpointed case files. The shop uses a validated transaction log, profit predictions, explanatory receipts, inspectable objects, balanced journals, and linked income statement, balance sheet and cash flow. The 3D objects are illustrative; the balances give exact amounts. New stock animates into place, reduced motion is respected, and a preparation state covers the first WebGL frame.
- Simple/example/deeper explanations, a wordbook and optional reasoning checks support the existing lessons. Private prose is saved and can be revisited in Me; it is explicitly not automatically graded. Coaching, shop decisions and cases survive v2 backup restore and legacy migration. Repeat decisions/cases cannot duplicate their initial XP awards. Repeated shop decisions and case steps still count as learning activity for daily goals and streaks.
- Optional sync encrypts learning snapshots in the browser, separates access and encryption capabilities, checks revisions, refreshes a stale conflict choice, and retains a pre-sync safety backup. Local preferences stay local. Its controls are gated on service availability; no existing Supabase project was modified. The user’s organisation choice is still needed before creating the isolated project and running hosted RLS/advisor/end-to-end checks. Mocked HTTP transport is not claimed as hosted verification.
- Mobile forms use 16px text, dynamic sheet sizing and scroll margins. Simple illustrations prevents WebGL context creation; the WebKit test verifies zero context probes with that setting. The physical iOS/Android keyboard, VoiceOver/TalkBack, haptics, OS gestures, thermal and battery checklist is in `docs/mobile-qa.md`; hardware was not available here.

Validation evidence:

- The full existing/new regression run passed 62 cases in 8.2 minutes, with the two-device flow passing separately. The readable recall visual baseline also passed on the hosted preview with snapshot comparison enabled.
- After final loading/API changes, all 10 affected Chromium cases passed, including real 3D pinch/rotation/scroll cooperation, the recall snapshot, all three cases, shop persistence, notebook retrieval, authenticated encryption, API validation/HEAD semantics, and two-device offline/conflict recovery. A deployed HEAD request exposed a Next.js Request-wrapper incompatibility; normalising the method without reconstructing the Request fixes it, and a running-server GET/HEAD check covers the HTTP boundary. Both WebKit mobile cases passed on the final production build.
- TypeScript, oxlint, oxfmt and the production build passed. CI now runs 64 Chromium cases and two WebKit cases against the production build.
- Hosted preview checks passed for the shop, XP repeat limits, coaching and Me reflections. A real offline reload opened the saved shop and resumed the bank-reconciliation checkpoint, kept 120 XP, used only `tally-offline-v9`, and reported no page errors.
- Actual WebGL shop rendering and inspection were checked on the preview. Visual evidence reviewed: `/workspace/scratch/business-mobile.png` and `/workspace/scratch/tally-shop-release-ready.png` (390 × 844). Muted pastel materials, dimensional blue awning, clear numerical balances, large sheet controls and whitespace remain consistent with Tally’s existing design.

### Hosted sync activation — 25 October 2026

The user selected the themba organisation. The separate `tally-sync` project
(`pxbuigcmfuxyuixaosos`, `eu-west-1`) now hosts the encrypted vault. The committed
migration is applied, with matching migration history and explicit RLS/grants.
The actual anonymous database role and hosted REST API passed owner-only access,
missing/wrong-key denial, ID-reassignment protection, stale revision rejection,
encrypted round-trip and deletion checks. Security advisors report no findings;
the performance advisor's InitPlan notice was checked against the actual plan,
which has two one-time InitPlans and a primary-key index scan.

Two independent hosted browser profiles passed real pairing, notes/reflections,
case and shop transfer, per-device themes, an offline reload with the connection
retained, competing offline edits, explicit conflict resolution, a safety backup
and deletion while keeping local progress. No page errors were observed. Test
keys were disposable, never committed, and their cloud copies were removed.
Server settings are configured for production, previews and development.
Physical-device checks remain documented separately in `docs/mobile-qa.md`.
