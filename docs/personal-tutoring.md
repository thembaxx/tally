# Personal tutoring in Tally

Tally adapts accounting practice to evidence of understanding and the learner's
choices. It does not estimate IQ, diagnose learning difficulties or assign a fixed
learning-style label. Reading speed, age, XP and time spent in focus mode do not
determine difficulty. Explanations, illustrations and practice remain available
together, and every lesson can still be explored.

## How a plan changes

| Signal                                                 | Tutor response                                                                                                   |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| No recorded practice                                   | Guided review; a full lesson first teaches its own example.                                                      |
| Optional starting-point answer or “not sure”           | Suggest standard or guided initial practice for that topic. This never establishes independent recall.           |
| Hints, retries or “Still learning”                     | Return guidance and bring the topic back sooner using the existing review scheduler.                             |
| Two retries or two hints in an activity                | Offer a separate worked example. In an ordinary numerical lesson, ease the next entry activity before it starts. |
| Clean guided practice                                  | Suggest standard practice without the method shown next time.                                                    |
| Independent recall on separate days                    | Recommend reverse or multi-step stretch questions for that topic. Same-day repeats do not accelerate this.       |
| Repeated unresolved authored reasoning check           | Prioritise that connection and recommend guided practice. Free-written reflections are not analysed.             |
| A struggling topic has a demonstrated prerequisite gap | Offer the supporting idea first. An unknown prerequisite never locks a lesson.                                   |
| A three-minute goal or strong support need             | Keep automatic tutor practice to one idea. Learners can choose one or two topics explicitly.                     |

The daily mix retains three activities. Its numerical question uses the current
profile when a new plan is created. Connected bakery, journal and case-file stories
keep their authored amounts and sequences; their explanations and optional support
remain available. Numerical lesson and review questions use all three difficulty
levels.

## Learner controls

Home and Practice have **Tune my learning** inside the tutor plan. Settings →
Learning → **Personalise my tutor** opens the same panel. It offers:

- An optional three-question starting point: equation, asset exchange and profit.
  There is no clock or total score. Every answer has a short explanation; an
  unfinished check resumes at the next unanswered idea. Refreshing it does not
  remove lesson history. Existing practice evidence always takes priority.
- Automatic guidance, smaller steps, or an explicit independent-practice choice.
  Independent mode starts with standard questions unless recall evidence supports
  stretch work. Hints and worked examples remain available.
- Plain language, a worked example, a deeper connection, or an automatic default.
  The explanation selector remembers an explicit choice for each topic, shop or
  case file; changing the general default clears these overrides.
- Automatic practice size, one idea or a mix of two ideas. This affects tutor
  sessions, not the three-part daily challenge.
- Up to three recent topics with a plain-language explanation of the current
  recommendation. These are observations about practice, not a global ability score.

Preferences are editable and applied to new question plans. A question already in
progress is not silently replaced while the learner is entering an answer. A
saved plan retains its exact question and difficulty after changing preferences.
Legacy unfinished lessons without difficulty metadata keep their original question.
Guided questions remain distinct from independent recall in the existing skill map.

## Storage and compatibility

The validated `tutor` field extends the existing `tally-progress-v1` record and
version 2 backups. Old data receives automatic defaults. Lesson IDs, notes, XP,
review dates and the learner's own words are preserved. `lessonChallenge` records
the chosen numerical question in new ordinary-lesson drafts; older drafts remain
valid without it. The profile travels with exported backups and optional encrypted
sync. Themes, audio and graphics preferences remain specific to each device.

No new service, package, analytics or external model is involved. The learner model
uses authored rules and authored teaching content, with bounded stored preferences.
Offline cache v11 includes the new interface. Offline use requires a successful
online visit and caching first.

## Teaching sources and limits

The design follows [EEF's metacognition and self-regulated learning guidance](https://educationendowmentfoundation.org.uk/education-evidence/guidance-reports/metacognition):
help learners plan, monitor and evaluate their learning, model a strategy, and
support increasing independence within the subject. It also applies [the Learning
Scientists' six strategies](https://www.learningscientists.org/blog/2019/11/28-1):
retrieval, spacing, interleaving, elaboration, concrete examples and dual coding.
Their guidance distinguishes using multiple representations from matching a fixed
“learning style”. These sources inform product decisions; they do not validate
Tally's particular thresholds or guarantee individual outcomes. The starting-point
check is deliberately small and cannot establish comprehensive accounting ability.
