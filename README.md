# Tally

**Small lessons. Big lightbulb moments.** A mobile-first, self-paced accounting tutor with interactive Three.js illustrations, everyday examples, and a gentle review rhythm.

## Run locally

Requires Node.js 22 or later.

```sh
npm ci
npm run dev
```

## What's included

- Four screens: Home, Learn, Practice, and Me. Responsive sidebar on larger screens and a spring-animated floating mobile navigation pill.
- Fifteen playable lessons across foundations, intermediate concepts, and introductions to advanced topics. Follow the Cash replaces the previous Cash Flow placeholder with two story-based challenges.
- Worked examples, interactive numerical explorations, specific explanatory feedback, optional hints, ungraded self-explanation, and confidence-based review scheduling after one or three days.
- Pointer-following swipe/tap sorting of assets, liabilities, and equity with direction previews. Short, diagonal, canceled and multi-pointer gestures do not submit answers. The 3D beam tilts according to the amounts sorted, with a live equation readout.
- A learning studio with four new lesson formats: journal-entry building with tappable/draggable account chips, accounting detective scenarios, branching story choices, and 3D flip cards that requeue uncertain ideas. All use the existing XP and review schedule.
- Text and numeric entry with recognized synonyms, loose number formatting, and Enter-to-next-field behavior.
- Drag-reordered statements and processes with a live animated 3D tower, edge scrolling and accessible move buttons. Journal chips support touch and mouse dragging with floating previews and highlighted targets; cancellation restores the previous selection. Recall cards support horizontal swipe-to-flip while vertical swipes scroll.
- Mobile sheets have a pull-down handle with short-pull rebound, plus ordinary close and keyboard controls. 3D scenes support sideways rotation, two-finger pinch, cooperative vertical/wheel scrolling, correct zoom buttons and reset. Automatic rotation stops after interaction.
- Interactive 3D comparison bars for profit, inventory, depreciation, accruals, ratios, budgeting, contribution margin, deferrals, and consolidation. Sliders and values share the same model.
- Date-seeded three-part daily challenges; first completion earns 90 XP and repeats earn 15 XP. Lessons earn 60 XP initially and 10 XP on review.
- Real local-calendar streaks, daily activity, achievements, and a five-minute focus timer. The timer pauses in hidden tabs and awards 10 XP once per day.
- System/light/dark themes, optional sound, supported-device haptics, exportable local progress, and an explicit reset flow.
- Installable PWA with icons, maskable icon, app shortcuts, screenshots, offline shell/assets, and update notification. Offline availability requires one online visit and successful service-worker installation.
- A public `/learn` shelf and 15 statically rendered lesson guides, with unique metadata, canonical URLs, breadcrumbs and structured data. Guides work without JavaScript and link to the matching interactive lesson.
- `robots.txt` advertises the 17-page sitemap. `/llms.txt` and `/llm.txt` share a generated source, and `/llms-full.txt` exposes the authored explanations and examples.

Progress is stored on the current browser/device. There is no account, server database, analytics, cross-device synchronization, or generative AI chat. The tutor uses authored accounting content and feedback. Introductory advanced-topic lessons are not a comprehensive professional accounting qualification.

## Checks

```sh
npm run typecheck
npm run lint
npm run format:check
npm run build
npm test
```

The suite also covers complete journal, recall, detective, and cash-flow story flows, existing-progress compatibility, reduced motion, automated AA checks, no-JavaScript guides, all public guide URLs, structured data, crawler files, and onboarding from a lesson deep link. Gesture tests use Chromium's real touch-input protocol for swipes, multi-touch cancellation, drag-and-drop, edge scrolling, reordering, sheet dismissal, card flips and 3D pinch/rotation; physical-device testing remains a separate check.

Tests use Playwright and `/usr/bin/chromium` in this workspace. For another machine, set `executablePath` in `playwright.config.ts` or install Playwright's Chromium. Start the app before running tests; `BASE_URL` can point the suite at a deployed app. The suite covers the accounting model, onboarding, swipes, answers, feedback, reordering, XP, review persistence, streaks, themes, focus timing, navigation, and five viewport widths.

`oxlint` and `oxfmt` handle linting and formatting. Dependencies are pinned and committed with the npm lockfile.

## Design and sources

Cobalt, apricot, lilac, mint, and lemon on warm cream, with a navy dark theme; Outfit headings; DM Sans text; DM Mono numbers; Phosphor icons; Motion springs, GSAP scroll entrances, and procedural Three.js models. The original folded-ribbon logo was generated from the supplied visual inspiration and normalized for the app, favicon, install icons, and sharing image. Controls adapted from EasyUI are credited in `THIRD_PARTY_NOTICES.md`. Anatomy informed the explanatory-object approach. Applama could not be located in npm or the connected tools, so it is not an app dependency.

Learning methods are informed by The Learning Scientists' retrieval practice, spacing, interleaving, elaboration, concrete examples, and dual coding. Theming follows the supplied web.dev guidance, with browser theme color, safe-area support, and an early theme script.

## Deployment

This project is connected to `thembaxx/tally` on GitHub and the `tally` Vercel project. Vercel builds with Next.js on Node.js 24. No secrets are needed. `NEXT_PUBLIC_SITE_URL` sets the canonical origin; it defaults to `https://tally-wine-alpha.vercel.app` so local and preview builds never become canonical. Copy `.env.example` when changing the primary domain. Vercel previews carry `noindex` metadata and an `X-Robots-Tag` header, while permitting crawling so the directive can be read.

## Brand and discovery maintenance

The master logo and usage guide live in `public/brand/`. Run `node scripts/build-brand.mjs` to rebuild icon sizes and the web mark from the master (uses Sharp, installed with Next.js). The dedicated maskable icon keeps the full mark within its central safe area. `/og.png` is a 1200 × 630 social card using the same logo, fonts and tagline.

Update lesson content in `lib/learning.ts` and `lib/studio-lessons.ts`; public guides, LLM references and the sitemap derive from those lessons. Search-friendly topic names live in `lib/guides.ts`. See `docs/seo.md` for validation and domain migration notes. Search indexing and AI citations are controlled by external services and are not implied by the presence of these files.
