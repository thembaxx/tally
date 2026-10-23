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
- Swipe/tap sorting of assets, liabilities, and equity. The 3D beam tilts according to the amounts sorted, with a live equation readout.
- A learning studio with four new lesson formats: journal-entry building with tappable/draggable account chips, accounting detective scenarios, branching story choices, and 3D flip cards that requeue uncertain ideas. All use the existing XP and review schedule.
- Text and numeric entry with recognized synonyms, loose number formatting, and Enter-to-next-field behavior.
- Drag-reordered statements and processes with a live animated 3D tower and accessible move buttons.
- Interactive 3D comparison bars for profit, inventory, depreciation, accruals, ratios, budgeting, contribution margin, deferrals, and consolidation. Sliders and values share the same model.
- Date-seeded three-part daily challenges; first completion earns 90 XP and repeats earn 15 XP. Lessons earn 60 XP initially and 10 XP on review.
- Real local-calendar streaks, daily activity, achievements, and a five-minute focus timer. The timer pauses in hidden tabs and awards 10 XP once per day.
- System/light/dark themes, optional sound, supported-device haptics, exportable local progress, and an explicit reset flow.
- Installable PWA with icons, maskable icon, app shortcuts, screenshots, offline shell/assets, and update notification. Offline availability requires one online visit and successful service-worker installation.
- SEO metadata, structured data, Open Graph image, robots, sitemap, `llms.txt`, and `llm.txt`.

Progress is stored on the current browser/device. There is no account, server database, analytics, cross-device synchronization, or generative AI chat. The tutor uses authored accounting content and feedback. Introductory advanced-topic lessons are not a comprehensive professional accounting qualification.

## Checks

```sh
npm run typecheck
npm run lint
npm run format:check
npm run build
npm test
```

The suite also covers complete journal, recall, detective, and cash-flow story flows, existing-progress compatibility, reduced motion, and automated AA checks.

Tests use Playwright and `/usr/bin/chromium` in this workspace. For another machine, set `executablePath` in `playwright.config.ts` or install Playwright's Chromium. Start the app before running tests; `BASE_URL` can point the suite at a deployed app. The suite covers the accounting model, onboarding, swipes, answers, feedback, reordering, XP, review persistence, streaks, themes, focus timing, navigation, and five viewport widths.

`oxlint` and `oxfmt` handle linting and formatting. Dependencies are pinned and committed with the npm lockfile.

## Design and sources

Cobalt, apricot, lilac, mint, and lemon on warm cream, with a navy dark theme; Outfit headings; DM Sans text; DM Mono numbers; Phosphor icons; Motion springs, GSAP scroll entrances, and procedural Three.js models. The original folded-ribbon logo was generated from the supplied visual inspiration and normalized for the app, favicon, install icons, and sharing image. Controls adapted from EasyUI are credited in `THIRD_PARTY_NOTICES.md`. Anatomy informed the explanatory-object approach. Applama could not be located in npm or the connected tools, so it is not an app dependency.

Learning methods are informed by The Learning Scientists' retrieval practice, spacing, interleaving, elaboration, concrete examples, and dual coding. Theming follows the supplied web.dev guidance, with browser theme color, safe-area support, and an early theme script.

## Deployment

This project is connected to `thembaxx/tally` on GitHub and the `tally` Vercel project. Vercel builds with Next.js on Node.js 24. No secrets or environment variables are needed. `NEXT_PUBLIC_SITE_URL` may optionally set the canonical origin; otherwise Vercel's production domain is used.
