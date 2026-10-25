-- Only encrypted learning snapshots are stored. The key is generated on-device.
create table public.progress_vaults (
  id text primary key check (id ~ '^[a-f0-9]{64}$'),
  revision uuid not null,
  payload jsonb not null check (
    jsonb_typeof(payload) = 'object'
    and payload - 'iv' - 'ciphertext' = '{}'::jsonb
    and payload ? 'iv' and payload ? 'ciphertext'
    and jsonb_typeof(payload->'iv') = 'string'
    and jsonb_typeof(payload->'ciphertext') = 'string'
    and (payload->>'iv') ~ '^[A-Za-z0-9+/]{16}$'
    and length(payload->>'ciphertext') between 24 and 400100
    and (payload->>'ciphertext') ~ '^[A-Za-z0-9+/]+={0,2}$'
    and octet_length(payload::text) <= 410000
  )
);
alter table public.progress_vaults enable row level security;
revoke all on public.progress_vaults from public, anon, authenticated;
grant select, insert, update, delete on public.progress_vaults to anon;
-- The row ID alone cannot authorise access. A separate 256-bit capability is
-- hashed here and must match it. No service-role key or SECURITY DEFINER code.
create policy "Private vault capability" on public.progress_vaults
  for all to anon
  using (
    id = (select encode(sha256(convert_to(coalesce(nullif(current_setting('request.headers', true), ''), '{}')::jsonb->>'x-tally-key', 'UTF8')), 'hex'))
    and (select coalesce(nullif(current_setting('request.headers', true), ''), '{}')::jsonb->>'x-tally-key') ~ '^[a-f0-9]{64}$'
  )
  with check (
    id = (select encode(sha256(convert_to(coalesce(nullif(current_setting('request.headers', true), ''), '{}')::jsonb->>'x-tally-key', 'UTF8')), 'hex'))
    and (select coalesce(nullif(current_setting('request.headers', true), ''), '{}')::jsonb->>'x-tally-key') ~ '^[a-f0-9]{64}$'
  );
