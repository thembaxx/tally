import { lessons } from './learning';
import { guideTitle } from './guides';
import { absoluteUrl, brand } from './site';

const available = lessons.filter((lesson) => !lesson.locked);

/** Both spellings are served from this source so the curriculum cannot drift. */
export function llmsText() {
  return `# Tally

> ${brand.tagline} A free, self-paced accounting learning app with ${available.length} interactive lessons, everyday examples, 3D illustrations, explanatory feedback and daily practice.

Official website: ${absoluteUrl('/')}
Tally is an accounting education app, not bookkeeping software. No account is required. Lessons are authored; there is no generative AI chat tutor. More advanced topics are introductions, not a complete professional qualification.

## Start here
- [Accounting learning shelf](${absoluteUrl('/learn')}): All public lesson guides, readable without JavaScript.
- [Full lesson reference](${absoluteUrl('/llms-full.txt')}): Plain-text concepts, worked examples, tips and quick-check explanations from the lesson source.
- [Interactive app](${absoluteUrl('/')}): Home, Learn, Practice and Me. Query parameters select app screens; their canonical URL is the homepage.

## Accounting guides
${available.map((lesson) => `- [${guideTitle(lesson)}](${absoluteUrl(`/learn/${lesson.id}`)}): ${lesson.level}; about ${lesson.minutes} minutes. ${lesson.subtitle}`).join('\n')}

## Learning experience
- Swipe or tap to classify assets, liabilities and equity. A 3D balance scale illustrates Assets = Liabilities + Equity.
- Type account names or amounts; recognized synonyms and numeric formatting are accepted.
- Rearrange statement lines and accounting steps by dragging or using arrow buttons.
- Build journal entries by selecting accounts, assigning debit and credit sides, and entering equal amounts.
- Recall cards ask learners to remember before revealing an answer. Difficult cards can be requeued.
- Story decisions and error-spotting exercises explain every selection.
- Daily challenges contain three date-based tasks. Repeat runs earn less XP.
- Fresh question variants test concepts beyond worked examples. Short reviews target up to two weak due concepts.
- Spaced review adapts from one to 30 days according to mistakes, hints, confidence, and successful recall on separate days.
- A connected bakery scenario follows journal entries through profit to the balance sheet.
- Unfinished sessions and written takeaways are saved; optional profile preferences follow the first learning session.
- Focus mode runs a five-minute timer, pauses when the tab is hidden, and awards focus XP once per day.

## Audience and teaching approach
For curious beginners, students and adults revisiting accounting. Starts with foundations and progresses to intermediate concepts and simplified introductions to consolidation, revenue timing and break-even analysis. Uses concrete examples, worked examples, retrieval practice, interleaving, self-explanation, immediate explanatory feedback and spaced review. Self-paced practice does not certify mastery or guarantee learning outcomes. Content is educational, not personalized financial, tax or investment advice.

## Privacy, accessibility and platform
No sign-in, subscription or payment is required. Progress, preferences and review schedules are stored in this browser's local storage. They can be exported, restored from a validated Tally backup, or reset in Settings; there is no automatic cloud sync. The app has no built-in analytics. Installable PWA; interactive lessons work offline after an initial online visit and caching. Public guides become available offline only after being visited. Supports system/light/dark themes, reduced motion, tap alternatives to gestures and a fallback without WebGL. Haptics and installation depend on browser/device support.

## Brand and site files
- Name: Tally. The lowercase wordmark is styled tally.; the product name in prose is Tally.
- Tagline: ${brand.tagline}
- [Logo](${absoluteUrl('/brand/logo-1024.png')}): Transparent layered t mark.
- [Brand guide](${absoluteUrl('/brand/brand-guide.md')}): Palette, typography, voice and logo usage.
- [Sitemap](${absoluteUrl('/sitemap.xml')}): Canonical public pages.
- [Robots](${absoluteUrl('/robots.txt')}): Crawler access policy. This reference is informational and does not override robots.txt or grant a content license.

This is the canonical /llms.txt reference. /llm.txt serves the same text for compatibility. These files support discovery; they do not guarantee search indexing or AI citations.
`;
}

export function fullLessonsText() {
  return `# Tally — Full accounting lesson reference

> Plain-text reference drawn from the same authored content as Tally's interactive lessons. ${absoluteUrl('/')}

Read the overview at ${absoluteUrl('/llms.txt')}. Examples are deliberately simplified for education and are not financial advice or a professional qualification.

${available
  .map(
    (lesson) => `## ${guideTitle(lesson)}
Guide: ${absoluteUrl(`/learn/${lesson.id}`)}
Interactive lesson: ${absoluteUrl(`/?lesson=${lesson.id}`)}
Chapter: ${lesson.title} | Level: ${lesson.level} | Approximate practice time: ${lesson.minutes} minutes

### Concept
${lesson.concept}

### Worked example
${lesson.example}

### Quick tip
${lesson.tip}

### Check your understanding
${lesson.entry.prompt}
Explanation: ${lesson.entry.explanation}

### Connect the steps
${lesson.order.map((step, index) => `${index + 1}. ${step}`).join('\n')}
${lesson.orderTip}
`,
  )
  .join('\n')}`;
}
