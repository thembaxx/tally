import { readBackup } from './backup';
import { type Progress } from './learning';
export const VAULT_KEY = 'tally-vault-v1';
export type VaultLink = { code: string; revision: string; baseline: string };
export type Sealed = { iv: string; ciphertext: string };
export type VaultRecord = { revision: string; payload: Sealed };
export function normaliseCode(value: string) {
  const raw = value
    .trim()
    .toLowerCase()
    .replace(/^tally-/, '')
    .replaceAll('-', '')
    .replaceAll(' ', '');
  if (!/^[a-f0-9]{64}$/.test(raw))
    throw new Error('Paste the complete Tally sync key from your other device.');
  return `tally-${raw}`;
}
export function createCode() {
  return `tally-${Array.from(crypto.getRandomValues(new Uint8Array(32)), (n) => n.toString(16).padStart(2, '0')).join('')}`;
}
async function digest(value: string) {
  return new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)));
}
export async function accessToken(code: string) {
  return Array.from(await digest(`tally-access:${normaliseCode(code)}`), (n) =>
    n.toString(16).padStart(2, '0'),
  ).join('');
}
async function encryptionKey(code: string) {
  return crypto.subtle.importKey(
    'raw',
    await digest(`tally-encryption:${normaliseCode(code)}`),
    'AES-GCM',
    false,
    ['encrypt', 'decrypt'],
  );
}
const base64 = (bytes: Uint8Array) =>
  btoa(Array.from(bytes, (n) => String.fromCharCode(n)).join(''));
const unbase64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
export function portable(p: Progress): Progress {
  return { ...p, theme: 'system', haptics: true, sound: false, soundVolume: 45, graphics: 'auto' };
}
export function keepDevicePreferences(local: Progress, remote: Progress): Progress {
  return {
    ...remote,
    theme: local.theme,
    haptics: local.haptics,
    sound: local.sound,
    soundVolume: local.soundVolume,
    graphics: local.graphics,
  };
}
export const fingerprint = (p: Progress) => JSON.stringify(portable(p));
export async function seal(p: Progress, code: string): Promise<Sealed> {
  const bytes = new TextEncoder().encode(JSON.stringify({ version: 2, progress: portable(p) }));
  if (bytes.length > 300000)
    throw new Error('This progress is too large for sync. Export a backup instead.');
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    await encryptionKey(code),
    bytes,
  );
  return { iv: base64(iv), ciphertext: base64(new Uint8Array(ciphertext)) };
}
export async function unseal(payload: Sealed, code: string): Promise<Progress> {
  try {
    const plain = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: unbase64(payload.iv) },
      await encryptionKey(code),
      unbase64(payload.ciphertext),
    );
    return readBackup(new TextDecoder().decode(plain));
  } catch {
    throw new Error('This key could not unlock the saved progress. Your local progress is safe.');
  }
}
export async function vaultRequest(
  code: string,
  method = 'GET',
  data?: unknown,
): Promise<VaultRecord | null> {
  const options: RequestInit = {
    method,
    headers: {
      Authorization: `Bearer ${await accessToken(code)}`,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
    signal: AbortSignal.timeout(15000),
  };
  if (data !== undefined && method !== 'GET') options.body = JSON.stringify(data);
  const res = await fetch('/api/sync', options);
  if (res.status === 404) return null;
  if (res.status === 409) throw new Error('CONFLICT');
  if (!res.ok)
    throw new Error(
      res.status === 503
        ? 'Progress sync is temporarily unavailable. Your learning is saved on this device.'
        : 'Sync could not connect. Your progress is saved on this device. Try again online.',
    );
  return res.status === 204 ? null : res.json();
}
