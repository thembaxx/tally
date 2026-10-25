'use client';
import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import type { Progress } from '@/lib/learning';
import {
  VAULT_KEY,
  createCode,
  fingerprint,
  keepDevicePreferences,
  normaliseCode,
  seal,
  unseal,
  vaultRequest,
  type VaultLink,
} from '@/lib/vault';
type Conflict = { progress: Progress; revision: string; code: string; joining: boolean };
export function useProgressSync(
  progress: Progress,
  setProgress: Dispatch<SetStateAction<Progress>>,
  ready: boolean,
) {
  const [link, setLink] = useState<VaultLink | null>(null);
  const [available, setAvailable] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(
    'Sync is optional. Learning stays on this device until you connect.',
  );
  const [conflict, setConflict] = useState<Conflict | null>(null);
  const latest = useRef(progress);
  latest.current = progress;
  const current = useRef(link);
  current.current = link;
  const waiting = useRef(conflict);
  waiting.current = conflict;
  const working = useRef(false);
  useEffect(() => {
    if (!ready) return;
    const controller = new AbortController();
    const check = async () => {
      try {
        const response = await fetch('/api/sync', { cache: 'no-store', signal: controller.signal });
        if (response.ok) setAvailable((await response.json()).configured === true);
      } catch {
        /* Local learning and an existing connection remain available. */
      }
    };
    void check();
    addEventListener('online', check);
    return () => {
      controller.abort();
      removeEventListener('online', check);
    };
  }, [ready]);
  function remember(value: VaultLink | null) {
    if (value) localStorage.setItem(VAULT_KEY, JSON.stringify(value));
    else localStorage.removeItem(VAULT_KEY);
    current.current = value;
    setLink(value);
  }
  function backup(p: Progress) {
    localStorage.setItem('tally-before-sync-v1', JSON.stringify({ version: 2, progress: p }));
  }
  async function run(task: () => Promise<void>) {
    if (working.current) return;
    working.current = true;
    setBusy(true);
    try {
      await task();
    } catch (e) {
      if (e instanceof Error && e.message === 'CONFLICT') {
        const connection = waiting.current || current.current;
        if (connection) {
          try {
            const remote = await vaultRequest(connection.code);
            if (remote) {
              const next = {
                code: connection.code,
                revision: remote.revision,
                progress: await unseal(remote.payload, connection.code),
                joining: waiting.current?.joining || false,
              };
              waiting.current = next;
              setConflict(next);
              setStatus(
                'Another device saved during this sync. Review the latest cloud copy before choosing.',
              );
              return;
            }
          } catch {
            /* Preserve local data and the pending choice for retry. */
          }
        }
      }
      setStatus(
        e instanceof Error && e.message !== 'CONFLICT'
          ? e.message
          : 'Another device just saved. Sync again to review its latest progress.',
      );
    } finally {
      working.current = false;
      setBusy(false);
    }
  }
  async function sync() {
    if (!current.current || waiting.current) return;
    if (!navigator.onLine) {
      setStatus('Offline. Your changes stay on this device and will sync when you reconnect.');
      return;
    }
    await run(async () => {
      const l = current.current!;
      const remote = await vaultRequest(l.code);
      if (!remote) {
        setStatus(
          'This cloud copy was removed. Disconnect to create a new one. Your local progress is safe.',
        );
        return;
      }
      let snapshot = latest.current;
      if (remote.revision !== l.revision) {
        const p = await unseal(remote.payload, l.code);
        snapshot = latest.current;
        if (fingerprint(snapshot) === fingerprint(p)) {
          remember({ ...l, revision: remote.revision, baseline: fingerprint(p) });
        } else if (
          fingerprint(snapshot) !== l.baseline ||
          document.querySelector('[role="dialog"][data-state="open"]')
        ) {
          const c = { progress: p, revision: remote.revision, code: l.code, joining: false };
          waiting.current = c;
          setConflict(c);
          setStatus('Another device has saved progress. Review both copies in Settings.');
          return;
        } else {
          backup(snapshot);
          setProgress(keepDevicePreferences(snapshot, p));
          remember({ ...l, revision: remote.revision, baseline: fingerprint(p) });
        }
      } else if (fingerprint(snapshot) !== l.baseline) {
        const revision = crypto.randomUUID();
        await vaultRequest(l.code, 'PUT', {
          expected: l.revision,
          revision,
          payload: await seal(snapshot, l.code),
        });
        remember({ ...l, revision, baseline: fingerprint(snapshot) });
      }
      setStatus('Up to date. Changes sync while Tally is open and online.');
    });
  }
  const syncRef = useRef(sync);
  syncRef.current = sync;
  useEffect(() => {
    if (!ready) return;
    function read() {
      try {
        const data = JSON.parse(localStorage.getItem(VAULT_KEY) || 'null');
        if (data && typeof data.revision === 'string' && typeof data.baseline === 'string') {
          normaliseCode(data.code);
          current.current = data;
          setLink(data);
        } else {
          current.current = null;
          setLink(null);
        }
      } catch {
        setStatus(
          'The saved sync connection could not be read. Your learning progress is still here.',
        );
      }
    }
    read();
    const changed = (e: StorageEvent) => {
      if (e.key === VAULT_KEY) read();
    };
    window.addEventListener('storage', changed);
    return () => window.removeEventListener('storage', changed);
  }, [ready]);
  useEffect(() => {
    if (!link?.code || !ready) return;
    const check = () => {
      if (!document.hidden) void syncRef.current();
    };
    const interval = setInterval(check, 30000);
    const first = setTimeout(check, 600);
    addEventListener('online', check);
    document.addEventListener('visibilitychange', check);
    return () => {
      clearInterval(interval);
      clearTimeout(first);
      removeEventListener('online', check);
      document.removeEventListener('visibilitychange', check);
    };
  }, [link?.code, ready]);
  useEffect(() => {
    if (!link) return;
    const timeout = setTimeout(() => void syncRef.current(), 2500);
    return () => clearTimeout(timeout);
  }, [progress, link]);
  return {
    available: available || !!link,
    link,
    busy,
    status,
    conflict,
    sync,
    create: () =>
      run(async () => {
        const code = createCode();
        const revision = crypto.randomUUID();
        const snapshot = latest.current;
        await vaultRequest(code, 'POST', { revision, payload: await seal(snapshot, code) });
        remember({ code, revision, baseline: fingerprint(snapshot) });
        setStatus(
          'Encrypted cloud copy created. Save your private sync key to connect another device.',
        );
      }),
    connect: (value: string) =>
      run(async () => {
        const code = normaliseCode(value);
        const remote = await vaultRequest(code);
        if (!remote)
          throw new Error(
            'No saved progress matches this key. Check the key on your other device.',
          );
        const c = {
          code,
          revision: remote.revision,
          progress: await unseal(remote.payload, code),
          joining: true,
        };
        waiting.current = c;
        setConflict(c);
        setStatus('Choose the progress you want on both devices.');
      }),
    resolve: (choice: 'cloud' | 'local') =>
      run(async () => {
        const c = waiting.current;
        if (!c) return;
        if (choice === 'cloud') {
          backup(latest.current);
          setProgress(keepDevicePreferences(latest.current, c.progress));
          remember({ code: c.code, revision: c.revision, baseline: fingerprint(c.progress) });
        } else {
          const snapshot = latest.current;
          backup(c.progress);
          const revision = crypto.randomUUID();
          await vaultRequest(c.code, 'PUT', {
            expected: c.revision,
            revision,
            payload: await seal(snapshot, c.code),
          });
          remember({ code: c.code, revision, baseline: fingerprint(snapshot) });
        }
        waiting.current = null;
        setConflict(null);
        setStatus(
          'Connected. The chosen copy is ready on both devices. A safety backup of the replaced copy is available below.',
        );
      }),
    cancel: () => {
      waiting.current = null;
      setConflict(null);
      setStatus('Your current progress is unchanged.');
    },
    disconnect: () => {
      if (working.current) return;
      remember(null);
      waiting.current = null;
      setConflict(null);
      setStatus('Disconnected. Local progress and the cloud copy are both kept.');
    },
    remove: () =>
      run(async () => {
        if (!current.current) return;
        await vaultRequest(current.current.code, 'DELETE');
        remember(null);
        waiting.current = null;
        setConflict(null);
        setStatus('Cloud copy deleted. Your local learning progress is kept.');
      }),
    restoreSafetyCopy: () => {
      const data = localStorage.getItem('tally-before-sync-v1');
      if (!data) return null;
      return data;
    },
  };
}
