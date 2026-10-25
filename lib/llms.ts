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
- South African English, rand (ZAR), and SAST calendar days are used throughout. Practice calculations leave VAT out unless a question states otherwise. Trade receivables/payables are also called debtors/creditors; the statement of financial position is the balance sheet.
- Swipe left for Asset, right for Liability or up for Equity, or use tap buttons. The card follows the pointer and previews its category; cancelled or multi-pointer gestures do not submit an answer. A 3D balance scale illustrates Assets = Liabilities + Equity.
- Type account names or amounts; recognised synonyms and numeric formatting are accepted.
- Rearrange statement lines and accounting steps by dragging or using arrow buttons.
- Build journal entries by dragging accounts into debit/credit slots using touch or a mouse, or selecting an account and tapping its side. Captured drags scroll near a sheet's edges. Then enter equal amounts.
- Recall cards ask learners to remember before revealing an answer with a tap or horizontal swipe. Difficult cards can be requeued. Rating understanding remains an explicit button choice.
- Drag 3D scenes sideways to rotate and pinch with two fingers to zoom. Vertical swipes and ordinary wheel gestures scroll the page. Rotate, zoom and reset buttons are also available. Automatic rotation stops after interacting.
- Mobile panels can be dismissed by pulling down their handle; close buttons and Escape remain available.
- Story decisions and error-spotting exercises explain every selection.
- Daily challenges contain three date-based tasks, with an entry question tailored to the learner's practice history. Repeat runs earn less XP.
- Fresh question variants test concepts beyond worked examples. Short reviews target up to two weak due concepts.
- Spaced review adapts from one to 30 days according to mistakes, hints, confidence, and successful recall on separate days.
- Personalized reviews use guided, standard, or stretch questions for every topic. They can add one fresh follow-up per topic after hints or retries; learners can also request guidance or a harder question and report confidence. Guided work does not count as independent recall, and extra questions do not add XP. Saved plans preserve questions and difficulty across reloads and backup restore.
- A personal tutor profile supports an optional untimed starting-point check, learner-controlled guidance, explanation defaults and remembered formats by topic. Practice size adapts to the daily goal and demonstrated support needs, with one/two-topic overrides. Known prerequisite gaps and unresolved reasoning checks can shape the next practice plan. Regular numerical lessons adapt difficulty; repeated difficulty offers a worked example and may ease the next activity between steps. Check-ins are starting clues, not independent-recall evidence or lesson completion. No IQ, diagnosis, reading-speed score or fixed learning-style classification is inferred. Existing questions and saved plans remain stable.
- Learn's skill map shows each topic's practice stage, recall evidence, and next review date, with direct lesson and review actions. Stages reflect recorded practice rather than a mastery score.
- A connected bakery lesson follows journal entries through profit to the statement of financial position. Practice also has a persistent 3D tuck-shop sandbox: predict profit, buy stock, make cash or credit sales, collect receivables, borrow, repay, pay rent, buy equipment and record illustrative depreciation. Every decision updates journal entries, profit, the balance sheet and cash flow. The model leaves VAT, interest, tax and drawings out.
- Three saved practical case files teach bank reconciliation, correction of a balanced but misclassified entry, and profit versus cash. Each has three tasks with clues and explanatory feedback.
- Optional coaching offers simple, example and deeper explanations, a tappable accounting wordbook, structured reasoning checks and saved private reflections. Authored checks can highlight recurring misconceptions; free-written reflections are not automatically assessed.
- Unfinished sessions and written takeaways are saved; optional profile preferences follow the first learning session.
- Focus mode runs a five-minute timer, pauses when the tab is hidden, and awards focus XP once per day.

## Audience and teaching approach
For curious beginners, students and adults revisiting accounting. Starts with foundations and progresses to intermediate concepts and simplified introductions to consolidation, revenue timing and break-even analysis. Uses concrete examples, worked examples, retrieval practice, interleaving, self-explanation, immediate explanatory feedback and spaced review. Self-paced practice does not certify mastery or guarantee learning outcomes. Content is educational, not personalized financial, tax or investment advice.

## Privacy, accessibility and platform
No sign-in, subscription or payment is required. Progress, preferences and review schedules are stored in this browser's local storage. They can be exported, restored from a validated Tally backup, or reset in Settings. Optional encrypted progress sync can be enabled in Settings when the sync service is available. A generated private key connects devices without email; AES-GCM encrypts learning snapshots in the browser before upload to a Supabase-backed vault. Tally cannot recover a lost key. Sync runs while the app is open and online, preserves device-specific preferences, and asks learners to choose a copy when there is a conflict. A pre-sync safety backup is retained locally. The app has no built-in analytics. Installable PWA; interactive lessons work offline after an initial online visit and caching. Public guides become available offline only after being visited. Supports system/light/dark themes, reduced motion, a Simple illustrations mode for older phones, tap alternatives to gestures and a fallback without WebGL. Haptics and installation depend on browser/device support.

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
