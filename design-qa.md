# Tally design and interaction QA

**final result: passed**

## Visual grounding

The source visual truth is the six user-supplied images in this conversation: floating iOS navigation and sheets, restrained dark surfaces, hexagonal achievements, friendly geometric characters, spacious rounded white cards, and warm colored geometric accents. These are inspiration references for a new accounting app, rather than a selected screen to reproduce pixel for pixel. The user explicitly requested procedural, interactive Three.js objects; the scale, tower, and comparison instruments are live geometry.

Implementation evidence:

- `public/screenshots/home-mobile.png`: 390 × 844 CSS pixels, density 1.
- `public/screenshots/home-desktop.png`: 1440 × 1000 CSS pixels, density 1.
- Additional full-page, lesson explorer, advanced lesson, and dark Settings captures were reviewed in the workspace at `/workspace/scratch/tally-*-final.png`, `/workspace/scratch/tally-explorer.png`, and `/workspace/scratch/tally-advanced.png`.
- The provided phone mockups contain device chrome. Comparison is limited to the intended app-content qualities; Tally uses the browser/device's real chrome.

## Findings and iteration history

1. **P1, typography:** the initial font fetch resolved to a single heavy font rather than variable fonts, making the whole interface excessively bold. Replaced with local variable DM Sans and Outfit files plus regular DM Mono. Revised desktop and mobile captures show clear weight hierarchy and correct wrapping.
2. **P2, mobile hero:** the balance scale was cropped and the headline wrapped too narrowly. Adjusted the mobile composition, widened the headline area, and placed the scale below the title. Revised 390 px capture shows the complete scale and readable primary action.
3. **P2, readability:** light secondary text and a few colored captions fell below AA contrast. Darkened the semantic muted/accent colors, hero captions, and focus copy; increased important mobile text sizes. Rechecked light and dark themes after animations settled.
4. **P1, compact navigation accessibility:** tablet navigation hid visible text without keeping an accessible button name. Added explicit names to all four navigation buttons. Responsive navigation now remains usable by keyboard and assistive technology.
5. **P2, offline readiness:** assets requested before initial service-worker activation could be missed. The worker now precaches shell script/style references and accepts observed static assets from the client. A fresh production-browser visit followed by a disconnected reload successfully opened a lesson, changed a 3D explorer, and checked an answer.

No actionable P0/P1/P2 findings remain within this implementation scope.

## Required surfaces

- **Typography:** Outfit headings, DM Sans interface text, DM Mono for numbers. Long lesson titles wrap; no ellipses hide learning content. Locally hosted fonts avoid third-party runtime requests.
- **Layout:** reviewed at 320, 390, 768, 1024, and 1440 px. Four-item navigation becomes a floating mobile pill. Lesson and Settings sheets scroll within the viewport. No horizontal page overflow.
- **Color:** shared semantic tokens support system/light/dark. Focus mode temporarily selects the calm dark palette and restores the preference afterward. Browser theme color follows the active theme.
- **Asset quality:** the 3D scale is a recognizable balance instrument with two suspended pans, a pivot, beam, post, base, feet, coins, and blocks. The tower follows statement order. Comparison bars and numerical labels use the same values. Models have rotation, pinch zoom, tap controls, shadows, and a no-WebGL fallback.
- **Copy:** real lesson content, authored examples, helpful retry explanations, optional hints, and ungraded reflections. No penalties for errors. Advanced lessons state the simplifications used in the examples. Cash Flow is clearly upcoming.

## Interaction proof

Browser-tested onboarding; complete sorting/type/reorder lessons; swipe classification; wrong-answer recovery; natural account synonyms; numerical formatting; Enter-to-next-field; accessible move buttons; first/repeat XP; local persistence; review dates; daily mix; themes; focus pause, completion, and hidden-tab behavior; URL/back navigation; exports and install guidance.

Automated axe WCAG A/AA checks reported no violations on Home, Learn, Practice, Me, and Settings in the light theme, and on Home and Settings in the dark theme. Browser page errors were checked during lesson, explorer, and offline runs; none were observed in the passing runs.

The final production-build Playwright suite passed all 6 tests (2.7 minutes). TypeScript, oxlint, oxfmt, and the optimized Next.js build also passed.

## Follow-up polish and limits

- Native haptics and the installation prompt depend on browser and device support; tap controls and installation instructions are always available.
- Physical iPhone/Android hardware was not available. Gestures and responsive layouts were tested in Chromium; native Safari installation needs a real-device check.
- The app covers eleven authored lessons, including introductions to selected advanced topics, and does not claim to certify professional mastery.
