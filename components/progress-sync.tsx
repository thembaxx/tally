'use client';
import { useState } from 'react';
import { CloudArrowUpIcon, CopyIcon, ArrowsClockwiseIcon } from '@phosphor-icons/react';
import type { Progress } from '@/lib/learning';
import type { useProgressSync } from './use-progress-sync';
type Sync = ReturnType<typeof useProgressSync>;
export function ProgressSync({ sync, progress }: { sync: Sync; progress: Progress }) {
  const [input, setInput] = useState('');
  const [reveal, setReveal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [remove, setRemove] = useState(false);
  const [downloadError, setDownloadError] = useState('');
  function downloadSafety() {
    try {
      const data = sync.restoreSafetyCopy();
      if (!data) {
        setDownloadError('No copy has been replaced by sync on this device yet.');
        return;
      }
      const url = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'tally-before-sync.json';
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setDownloadError('');
    } catch {
      setDownloadError('This browser could not read the safety backup.');
    }
  }
  return (
    <section className="sync-panel" aria-label="Progress sync">
      <h3>
        <CloudArrowUpIcon /> Take your progress with you.
      </h3>
      <p>
        Optional, encrypted sync for your lessons, shop, projects and notes. No email or account
        needed. Theme, sound and 3D preferences stay on each device.
      </p>
      <p className="fine">
        Your private sync key unlocks your learning data. Keep it somewhere safe and share it only
        with your own devices. Tally cannot recover a lost key. Sync runs while the app is open and
        online.
      </p>
      {sync.link ? (
        <>
          <div className="sync-actions">
            <button
              className="small-button"
              disabled={sync.busy || !!sync.conflict}
              onClick={() => void sync.sync()}
            >
              <ArrowsClockwiseIcon /> {sync.busy ? 'Syncing…' : 'Sync now'}
            </button>
            <button
              className="text-button"
              aria-expanded={reveal}
              onClick={() => setReveal(!reveal)}
            >
              {reveal ? 'Hide private key' : 'Connect another device'}
            </button>
          </div>
          {reveal && (
            <>
              <code className="sync-code">{sync.link.code}</code>
              <button
                className="text-button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(sync.link!.code);
                    setCopied(true);
                  } catch {
                    setCopied(false);
                  }
                }}
              >
                <CopyIcon /> {copied ? 'Copied' : 'Copy private key'}
              </button>
              <p className="fine">
                On your other device, open Settings → Progress sync → paste this key.
              </p>
            </>
          )}
          <div className="sync-actions">
            <button className="text-button" disabled={sync.busy} onClick={sync.disconnect}>
              Disconnect this device
            </button>
            <button className="text-button" disabled={sync.busy} onClick={() => setRemove(true)}>
              Delete cloud copy
            </button>
          </div>
        </>
      ) : (
        <>
          <button
            className="button primary full"
            disabled={sync.busy || !!sync.conflict}
            onClick={() => void sync.create()}
          >
            Enable progress sync
          </button>
          <details className="coach-tools">
            <summary>I have a sync key</summary>
            <form
              className="coach-content"
              onSubmit={(e) => {
                e.preventDefault();
                void sync.connect(input);
              }}
            >
              <label>
                Private sync key
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  autoComplete="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  type="password"
                  placeholder="tally-…"
                />
              </label>
              <button
                className="small-button"
                disabled={sync.busy || !!sync.conflict || !input.trim()}
              >
                Find my progress
              </button>
            </form>
          </details>
        </>
      )}
      {sync.conflict && (
        <div className="sync-conflict" role="region" aria-label="Choose progress to sync">
          <strong>
            {sync.conflict.joining
              ? 'Connect with this progress?'
              : 'Both devices have progress to review.'}
          </strong>
          <p>
            This device: {progress.xp} XP · {progress.completed.length} lessons ·{' '}
            {progress.experiences.transactions.length} shop decisions.
            <br />
            Cloud copy: {sync.conflict.progress.xp} XP · {sync.conflict.progress.completed.length}{' '}
            lessons · {sync.conflict.progress.experiences.transactions.length} shop decisions.
          </p>
          <p>
            Choose one complete copy; progress is not combined. A safety backup of the replaced copy
            stays on this device.
          </p>
          <div className="sync-actions">
            <button
              className="small-button"
              disabled={sync.busy}
              onClick={() => void sync.resolve('cloud')}
            >
              Use cloud progress
            </button>
            <button
              className="small-button"
              disabled={sync.busy}
              onClick={() => void sync.resolve('local')}
            >
              Use this device on both
            </button>
            <button className="text-button" disabled={sync.busy} onClick={sync.cancel}>
              Decide later
            </button>
          </div>
        </div>
      )}
      {remove && (
        <div className="sync-conflict">
          <strong>Delete the cloud copy for every linked device?</strong>
          <p>
            Local progress stays on each device. Other devices will need a new key to sync again.
          </p>
          <button
            className="small-button"
            disabled={sync.busy}
            onClick={() => {
              void sync.remove();
              setRemove(false);
            }}
          >
            Delete encrypted cloud copy
          </button>
          <button className="text-button" onClick={() => setRemove(false)}>
            Keep cloud copy
          </button>
        </div>
      )}
      <p role="status">{sync.status}</p>
      <button className="text-button" onClick={downloadSafety}>
        Download pre-sync safety backup
      </button>
      {downloadError && <p role="alert">{downloadError}</p>}
    </section>
  );
}
