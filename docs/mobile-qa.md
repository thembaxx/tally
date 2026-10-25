# Mobile release checks

Automated coverage uses Chromium touch input and lockfile-pinned WebKit 27.2.
`npm test` covers real browser pointer events, touch cancellation, multi-touch,
drag targets, edge scrolling, 3D rotation/pinch/reset, reduced motion and offline
learning. `npm run test:mobile` covers WebKit taps, short/narrow sheets, legible
input text, focus restoration, checkpoint persistence and explanation controls.

The new Simple illustrations setting avoids creating WebGL contexts. Hidden,
off-screen and modal-obscured 3D scenes pause rendering. Mobile form fields use
at least 16px text to avoid focus zoom, and sheets use dynamic viewport heights,
safe-area padding and scroll margins. These controls reduce graphics work; no
battery-life claim is inferred from automated browser checks.

## Physical-device pass (requires hardware)

Record device model, OS, browser version, date and outcome for every run. Use a
current iPhone in Safari and as an installed PWA, plus a budget Android device in
Chrome and as an installed PWA. Include portrait, landscape, larger text, and a
small iPhone-sized screen. Desktop WebKit is not a physical iOS simulator.

1. Open Settings, enter a long name, and edit a lesson number/text answer with the
   software keyboard visible. Check the focused field, Continue button, bottom
   safe area, orientation change and keyboard dismissal. Focus should not zoom
   the page. Test decimal commas and hardware-keyboard Enter.
2. Swipe-sort, cancel a drag, add a second finger, reorder near a sheet edge,
   and place a journal account. Scroll through a scene vertically, rotate it
   sideways, pinch to zoom, and use every tap alternative. Browser edge gestures
   should remain usable. Verify haptics only on supporting hardware.
3. Enable VoiceOver/TalkBack. Navigate the four main tabs, sheet title/close,
   prediction options, statements, inputs, answer feedback, wordbook and sync
   choice. Confirm understandable reading order, visible focus and no traps.
4. Turn on Reduce Motion and large text. Check contrast in light/dark themes,
   touch targets, no clipped statements, and text reflow without sideways scrolling.
5. Install online, finish a shop decision and project step, then close and reopen
   offline. Confirm saved progress and assets. Return online, receive an update,
   finish or close any lesson, apply the update and verify notes and checkpoints.
6. Compare a five-minute 3D session with Simple illustrations on the budget
   device. Observe thermal throttling, responsiveness and battery in OS tooling.
   Lock the screen and background the app; focus time should pause and hidden
   scenes should stop rendering. Record observations instead of estimating savings.
7. If hosted sync is enabled, connect phone and computer with a private key,
   continue a shop, make different offline edits, review the conflict, download
   the safety copy, disconnect, and delete a disposable test vault. Do not use
   a real learner’s key in screenshots or bug reports.

Physical-device checks have not been executed by the cloud agent. Keep that
distinction when reporting release verification.
