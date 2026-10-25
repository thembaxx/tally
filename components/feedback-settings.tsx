'use client';

import { useEffect, useState } from 'react';
import {
  HandTapIcon,
  ConfettiIcon,
  StackIcon,
  SpeakerHighIcon,
  VibrateIcon,
} from '@phosphor-icons/react';
import type { Progress } from '@/lib/learning';
import type { FeedbackCue } from '@/lib/feedback';
import type { useFeedback } from './use-feedback';
import { Switch } from './ui/controls';

export function FeedbackSettings({
  progress: p,
  patch,
  engine,
}: {
  progress: Progress;
  patch: (update: Partial<Progress>) => void;
  engine: ReturnType<typeof useFeedback>;
}) {
  const [preview, setPreview] = useState<FeedbackCue | null>(null);
  const [hapticMessage, setHapticMessage] = useState('');
  useEffect(() => {
    if (!preview) return;
    const timer = setTimeout(() => setPreview(null), 1100);
    return () => clearTimeout(timer);
  }, [preview]);
  const muted = !p.sound || p.soundVolume === 0;
  return (
    <>
      <h3 className="settings-section-title">Sound &amp; feel</h3>
      <div className="setting-row">
        <span>
          <strong>
            <VibrateIcon /> Haptic feedback
          </strong>
          <small>Little pulses for selections, placing pieces and milestones.</small>
        </span>
        <Switch
          checked={p.haptics}
          label="Haptic feedback"
          feedback={false}
          onChange={(value) => {
            patch({ haptics: value });
            setHapticMessage('');
            if (value) engine.pulse('correct', { force: true });
          }}
        />
      </div>
      <div className="haptic-test-row">
        <p role="status">
          {hapticMessage ||
            (engine.hapticsSupported
              ? 'Vibration depends on your phone and its system settings.'
              : 'This browser doesn’t offer vibration. Sound and visual feedback still work.')}
        </p>
        <button
          type="button"
          className="small-button"
          disabled={!p.haptics || !engine.hapticsSupported}
          aria-label="Test vibration"
          onClick={() => {
            const accepted = engine.pulse('correct');
            setHapticMessage(
              accepted
                ? 'Test sent: two little taps. Your phone controls how they feel.'
                : 'Vibration couldn’t start. Check your phone’s vibration settings.',
            );
          }}
        >
          <VibrateIcon /> Test
        </button>
      </div>
      <div className="setting-row">
        <span>
          <strong>
            <SpeakerHighIcon /> Sound effects
          </strong>
          <small>Soft clicks, satisfying placements and a little celebration.</small>
        </span>
        <Switch
          checked={p.sound}
          label="Sound effects"
          feedback={false}
          onChange={(value) => {
            patch({ sound: value });
            if (value) engine.cue('correct', { force: true });
          }}
        />
      </div>
      <div className="setting-row sound-volume-row">
        <span>
          <strong>Sound volume</strong>
          <small>Always your choice. No background music.</small>
        </span>
        <div className="sound-volume-control">
          <input
            aria-label="Sound volume"
            type="range"
            min="0"
            max="100"
            step="5"
            value={p.soundVolume}
            disabled={!p.sound}
            onChange={(event) => patch({ soundVolume: Number(event.target.value) })}
            onPointerUp={() => engine.cue('select')}
            onKeyUp={(event) => {
              if (
                ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(
                  event.key,
                )
              )
                engine.cue('select');
            }}
          />
          <span className="mono" aria-hidden="true">
            {p.soundVolume}%
          </span>
        </div>
      </div>
      <div className="feedback-sampler" role="group" aria-label="Try the feedback">
        {(
          [
            {
              cue: 'select',
              label: 'A little click',
              name: 'Preview selection sound',
              Icon: HandTapIcon,
            },
            { cue: 'place', label: 'Into place', name: 'Preview placement sound', Icon: StackIcon },
            { cue: 'complete', label: 'You did it!', name: 'Preview sounds', Icon: ConfettiIcon },
          ] as const
        ).map(({ cue, label, name, Icon }) => (
          <button
            type="button"
            key={cue}
            aria-label={name}
            disabled={muted}
            className={preview === cue ? 'is-playing' : ''}
            onClick={() => {
              setPreview(cue);
              engine.cue(cue);
            }}
          >
            <span>
              <Icon size={23} weight="duotone" />
            </span>
            {label}
          </button>
        ))}
      </div>
      <p className="feedback-footnote">
        Made for headphones, quiet corners and small wins. These preferences stay on this device.
      </p>
    </>
  );
}
