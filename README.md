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
- Sixteen playable lessons across foundations, intermediate concepts, and introductions to advanced topics. Follow the Cash replaces the previous Cash Flow placeholder with two story-based challenges.
- Worked examples, interactive numerical explorations, specific explanatory feedback, optional hints, ungraded self-explanation, saved takeaways, and adaptive review spacing from one to 30 days.
- Fresh numerical and scenario variants for standard lesson practice, daily mixes, and short reviews of every topic. Home prioritizes up to two weak due concepts; reviews record hint use and retries. Independent recall on separate days grows spacing to 3, 7, 14, then 30 days; difficulty brings it back to one day. Same-day repeats do not grow spacing.
- First-time learners can try an activity immediately and choose optional profile/goal preferences after their first completion. Unfinished sessions resume at the current activity with the same generated question and saved reflection; partially entered activity answers restart.
- Your First Bakery connects four journal entries, an income calculation, and a balance sheet using one consistent business. Its amounts vary on repeat lessons.
- Swipe/tap sorting of assets, liabilities, and equity. The 3D beam tilts according to the amounts sorted, with a live equation readout.
- A learning studio with four new lesson formats: journal-entry building with tappable/draggable account chips, accounting detective scenarios, branching story choices, and 3D flip cards that requeue uncertain ideas. All use the existing XP and review schedule.
- Text and numeric entry with recognized synonyms, loose number formatting, and Enter-to-next-field behavior.
- Drag-reordered statements and processes with a live animated 3D tower and accessible move buttons.
- Interactive 3D comparison bars for profit, inventory, depreciation, accruals, ratios, budgeting, contribution margin, deferrals, and consolidation. Sliders and values share the same model.
- Date-seeded three-part daily challenges; first completion earns 90 XP and repeats earn 15 XP. Lessons earn 60 XP initially and 10 XP on repeat completion; targeted reviews earn 10 XP per concept.
- Real local-calendar streaks, daily activity, achievements, and a five-minute focus timer. The timer pauses in hidden tabs and awards 10 XP once per day.
- System/light/dark themes, opt-in interaction soundscape with per-device volume, supported-device haptics, exportable and importable local progress, and an explicit reset flow. Audio cues cover navigation, selection, correct/incorrect answers, lessons, and focus sessions; the sound setting includes a preview. Sounds are short original Web Audio synth patches informed by React Bits Sound Lab categories, not external audio samples.
- Installable PWA with icons, maskable icon, app shortcuts, screenshots, offline shell/assets, and update notification. Offline availability requires one online visit and successful service-worker installation.
- A public `/learn` shelf and 16 statically rendered lesson guides, with unique metadata, canonical URLs, breadcrumbs and structured data. Guides work without JavaScript and link to the matching interactive lesson.
- `robots.txt` advertises the 18-page sitemap. `/llms.txt` and `/llm.txt` share a generated source, and `/llms-full.txt` exposes the authored explanations and examples.

Progress is stored on the current browser/device. Existing v1 progress and separate review schedules migrate automatically. Settings exports version 2 backups containing progress, reviews, takeaways, and the unfinished session; restore accepts those backups and older versionless exports, validates the file, and requires explicit replacement confirmation. There is no account, server database, analytics, cross-device synchronization, or generative AI chat. The tutor uses authored accounting content and feedback. Introductory advanced-topic lessons are not a comprehensive professional accounting qualification.

## Checks

```sh
npm run typecheck
npm run lint
npm run format:check
npm run build
npm test
```

The suite also covers complete journal, recall, detective, and cash-flow story flows, existing-progress compatibility, reduced motion, automated AA checks, no-JavaScript guides, all public guide URLs, structured data, crawler files, immediate practice from lesson deep links, adaptive review, backup restore, saved takeaways, and session recovery.

Tests use Playwright and `/usr/bin/chromium` in this workspace. For another machine, set `executablePath` in `playwright.config.ts` or install Playwright's Chromium. Start the app before running tests; `BASE_URL` can point the suite at a deployed app. The suite covers the accounting model, onboarding, swipes, answers, feedback, reordering, XP, review persistence, streaks, themes, focus timing, navigation, and five viewport widths.

`oxlint` and `oxfmt` handle linting and formatting. Dependencies are pinned and committed with the npm lockfile.

## Design and sources

Cobalt, apricot, lilac, mint, and lemon on warm cream, with a navy dark theme; Outfit headings; DM Sans text; DM Mono numbers; Phosphor icons; Motion springs, GSAP scroll entrances, and procedural Three.js models. The original folded-ribbon logo was generated from the supplied visual inspiration and normalized for the app, favicon, install icons, and sharing image. Controls adapted from EasyUI are credited in `THIRD_PARTY_NOTICES.md`. Anatomy informed the explanatory-object approach. Applama could not be located in npm or the connected tools, so it is not an app dependency.

Learning methods are informed by The Learning Scientists' retrieval practice, spacing, interleaving, elaboration, concrete examples, and dual coding. Theming follows the supplied web.dev guidance, with browser theme color, safe-area support, and an early theme script.

## Deployment

This project is connected to `thembaxx/tally` on GitHub and the `tally` Vercel project. Vercel builds with Next.js on Node.js 24. No secrets are needed. `NEXT_PUBLIC_SITE_URL` sets the canonical origin; it defaults to `https://tally-wine-alpha.vercel.app` so local and preview builds never become canonical. Copy `.env.example` when changing the primary domain. Vercel previews carry `noindex` metadata and an `X-Robots-Tag` header, while permitting crawling so the directive can be read.

## Brand and discovery maintenance

The master logo and usage guide live in `public/brand/`. Run `node scripts/build-brand.mjs` to rebuild icon sizes and the web mark from the master (uses Sharp, installed with Next.js). The dedicated maskable icon keeps the full mark within its central safe area. `/og.png` is a 1200 × 630 social card using the same logo, fonts and tagline.

Update lesson content in `lib/learning.ts`, `lib/studio-lessons.ts`, and `lib/bakery.ts`; generated practice is in `lib/questions.ts` and spacing is in `lib/reviews.ts`. Public guides, LLM references and the sitemap derive from those lessons. Search-friendly topic names live in `lib/guides.ts`. See `docs/seo.md` for validation and domain migration notes. Search indexing and AI citations are controlled by external services and are not implied by the presence of these files.
