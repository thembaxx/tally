# Optional encrypted progress sync

Core learning, the shop, cases, coaching and backup restore work without a server.
Sync is opt-in in Settings. It connects a learner’s own devices with a randomly
generated 256-bit private key, without an email address or account.

## Hosting

Use a dedicated Supabase project. Apply the committed
`supabase/migrations/20261025062829_encrypted_progress_vaults.sql` after inspecting
the project’s tables. Set `TALLY_SYNC_URL` and `TALLY_SYNC_PUBLISHABLE_KEY` on the
Vercel project for production and previews, then deploy. Use a **publishable** key,
never a service-role key. These variables stay on the server. The browser talks
only to `/api/sync`; that endpoint is excluded from service-worker caching and
returns `private, no-store` and `noindex` headers. Without the variables the public availability check returns `configured: false`, authenticated sync requests return
503, and the app hides the new-connection controls and leaves all local learning intact. An existing linked device still has its connection and recovery controls.

## Data and access

- AES-256-GCM encrypts a version 2 progress snapshot on the device with a fresh
  96-bit nonce. Domain-separated SHA-256 derivations produce independent encryption
  and access keys from the random secret. The encryption key never reaches the API.
- The API receives an access capability in its Authorization header, derives the
  vault ID with SHA-256, and forwards the capability to PostgREST. RLS matches the
  capability hash to the row for SELECT, INSERT, UPDATE and DELETE. Knowing the row
  ID or publishable key alone does not grant access. No privileged database function
  or service-role credential is used. SQL grants are explicit.
- The database stores only the hashed ID, a revision UUID and authenticated
  ciphertext/nonce. It receives no plaintext names, notes or learning history.
- Snapshots are capped at 300 KB before encryption. The API streams at most 450 KB,
  validates ciphertext shape and accepts writes only from the same origin when an
  Origin header is present. SQL applies payload shape and size limits too.
- This is capability-based access, not an identity service. Anyone with the private
  key can read, replace or delete that vault. It is for a learner’s own devices, not
  classroom sharing. Keys cannot be recovered or reset by Tally. Browser extensions
  and code with same-origin storage access remain within the local trust boundary.

## Behaviour and recovery

Sync runs after local changes, on reconnect/tab return, and every 30 seconds while
visible. There is no background-sync guarantee after the app closes. Failed writes
keep the local changes and baseline for the next attempt. Compare-and-set revision
checks reject stale writes; learning records are never naively added together.

Connecting a device always shows both progress summaries. Concurrent offline edits
or new remote progress while a lesson/sheet is open require an explicit choice in
Settings. A cloud copy can be applied automatically only if local progress still
matches the last synced baseline and no sheet is open. Replaced progress is stored
locally as `tally-before-sync-v1`; Settings can download this safety backup for
normal validated import. It keeps only the most recent replaced copy, so export
important backups separately.

Theme, sound, haptics and graphics settings stay device-specific. Unfinished lessons,
reviews, notes, shop transactions, case checkpoints and coaching are synced.
Disconnecting keeps local data and the cloud vault. Deleting the cloud copy needs
explicit confirmation and affects all linked devices; their local data remains.
Resetting local progress first disconnects sync and keeps the existing cloud copy.
No key or capability is put in URLs, analytics, application logs or exported backups.

## Verification

`tests/sync.spec.ts` checks authenticated encryption, nonce freshness, wrong keys,
tampering, API validation and compare-and-set behaviour. A two-context browser flow
uses an in-memory HTTP transport to test connecting, preferences, conflicts, offline
changes, safety copies and deletion without relying on a particular hosted vault.
Before enabling a hosted service, also verify anonymous RLS denial, correct-key
read/write, wrong-key denial, stale revisions and deletion through its actual API;
run Supabase security/performance advisors. Do not call mocked transport checks a
hosted end-to-end verification.
