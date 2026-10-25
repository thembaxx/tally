# Sound and touch feedback

Tally pairs small sounds and vibration patterns with meaningful actions: navigation,
selection, picking up and placing journal accounts, rearranging statements, answers,
lesson completion and focus sessions. It does not play feedback on every scroll,
3D frame, hover or keystroke. Move buttons and drag placement share the same cue.

Sound is off by default. Settings → Sound & feel includes an independent haptic
switch, vibration test, volume slider and three sound previews. Existing preferences
and backups remain compatible; these preferences stay local during cloud sync.
Reduced-motion settings also disable the preview animation.

## React Bits Sound Lab

Seven exported presets from [React Bits Sound Lab](https://reactbits.dev/tools/sound-lab)
are included in the application, without its rendering engine or a runtime package:

| Preset | Tally action          | Encoded bytes |
| ------ | --------------------- | ------------: |
| Felt   | Tap and pick up       |         2,341 |
| Tab    | Navigation            |         1,714 |
| Unfold | Open                  |         3,386 |
| Check  | Selection             |         2,132 |
| Place  | Place or move a piece |         2,759 |
| Tally  | Correct answer        |         3,595 |
| Bloom  | Completion            |         8,820 |

Total: 24,747 bytes (about 24.2 KiB), mono MP3 at 64 kbit/s and 44.1 kHz.
Source snapshot: `davidhdev/react-bits@e12c22192ac7b4b452c5e2feb9b586d74765d696`,
`src/sounds/ts/{felt,tab,unfold,check,place,tally,bloom}.ts` and its
`renderSound` export from `react-bits-sound.ts`. Offline rendering uses
`tone: -0.12`, `space: -0.3`, and `length: 0.85` for Bloom (other lengths default).
No samples or engine code are fetched from React Bits when Tally runs.

The exports are part of Tally, not a standalone sound pack. Copyright © 2026
David Haz, MIT + Commons Clause. The full upstream licence is included at
[public/sounds/REACT_BITS_LICENSE.md](../public/sounds/REACT_BITS_LICENSE.md).
Original synth cues remain for hints, flips, gentle retry and focus, and provide
an immediate fallback before an MP3 has decoded or if a file cannot load.

## Browser behaviour

One lazily created Web Audio context serves both the app and its dialog portals.
Decoded clips are reused. Playback requires an interaction, respects the saved
volume, stops when muted or hidden, and drops pending cues rather than replaying
on return. Failed downloads, blocked audio or throwing vibration APIs cannot
interrupt an accounting activity. The service worker precaches all seven clips
so they remain available after an online visit and successful offline installation.

Haptics use short `navigator.vibrate` patterns, independent of sound. The browser
API offers duration and pauses, not calibrated native impact intensity. Selection
pulses are rate-limited; placement and answer cues remain distinct. Disabling
haptics or leaving the page cancels an active pattern.

[MDN's compatibility table](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/vibrate#browser_compatibility)
reports no standard Vibration API support in Safari/iOS. Tally detects the API
rather than guessing from a device name, disables the test when unavailable and
explains the limit. It does not simulate vibration using hidden form controls.
An available API or successful return value does not establish that hardware
vibrated: silent modes, device settings and missing vibration hardware can limit it.
Audio follows [MDN's Web Audio best practices](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices).

## Verification

Browser tests exercise real MP3 decoding/playback, opt-in, one-context reuse,
mute/visibility cancellation, an independent haptic setting, blocked APIs,
fallback synthesis and offline reload. Vibration requests are instrumented in
Chromium; WebKit verifies the unsupported state and real sound decoding. These
checks cannot establish physical vibration feel, iOS silent-switch behaviour or
Bluetooth routing; see [mobile QA](mobile-qa.md).
