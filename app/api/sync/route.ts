import { createHash } from 'node:crypto';
const headers = {
  'Cache-Control': 'private, no-store',
  'X-Content-Type-Options': 'nosniff',
  'X-Robots-Tag': 'noindex, nofollow',
};
function reply(body: unknown, status = 200) {
  return Response.json(body, { status, headers });
}
const uuid = (v: unknown) =>
  typeof v === 'string' &&
  /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(v);
async function limitedBody(request: Request) {
  if (Number(request.headers.get('content-length') || 0) > 450000) throw new Error('Too large');
  const reader = request.body?.getReader();
  if (!reader) throw new Error('Missing body');
  const chunks: Uint8Array[] = [];
  let length = 0;
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    length += value.length;
    if (length > 450000) {
      await reader.cancel();
      throw new Error('Too large');
    }
    chunks.push(value);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}
async function handle(request: Request) {
  const url = process.env.TALLY_SYNC_URL;
  const key = process.env.TALLY_SYNC_PUBLISHABLE_KEY;
  const token = request.headers.get('authorization')?.replace(/^Bearer /, '');
  if (!url || !key)
    return reply({ configured: false }, request.method === 'GET' && !token ? 200 : 503);
  if (request.method === 'GET' && !token) return reply({ configured: true });
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return reply({ error: 'Invalid sync access' }, 401);
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin)
    return reply({ error: 'Invalid origin' }, 403);
  const id = createHash('sha256').update(token).digest('hex');
  const remote = new URL('/rest/v1/progress_vaults', url);
  const method = request.method;
  let body: string | undefined;
  if (method !== 'POST') remote.searchParams.set('id', `eq.${id}`);
  if (method === 'PUT' || method === 'POST') {
    let data;
    try {
      data = await limitedBody(request);
    } catch {
      return reply({ error: 'Invalid or oversized sync payload' }, 400);
    }
    if (
      !data ||
      typeof data !== 'object' ||
      Array.isArray(data) ||
      !uuid(data.revision) ||
      (method === 'PUT' && !uuid(data.expected)) ||
      typeof data.payload?.iv !== 'string' ||
      !/^[A-Za-z0-9+/]{16}$/.test(data.payload.iv) ||
      typeof data.payload?.ciphertext !== 'string' ||
      data.payload.ciphertext.length < 24 ||
      data.payload.ciphertext.length > 400100 ||
      !/^[A-Za-z0-9+/]+={0,2}$/.test(data.payload.ciphertext)
    )
      return reply({ error: 'Invalid encrypted payload' }, 400);
    body = JSON.stringify({
      ...(method === 'POST' ? { id } : {}),
      revision: data.revision,
      payload: { iv: data.payload.iv, ciphertext: data.payload.ciphertext },
    });
    if (method === 'PUT') remote.searchParams.set('revision', `eq.${data.expected}`);
  }
  remote.searchParams.set('select', 'revision,payload');
  try {
    const res = await fetch(remote, {
      method: method === 'PUT' ? 'PATCH' : method,
      headers: {
        apikey: key,
        'x-tally-key': token,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body,
      cache: 'no-store',
      signal: AbortSignal.timeout(12000),
    });
    if (res.status === 409) return reply({ error: 'A newer revision exists' }, 409);
    if (!res.ok) return reply({ error: 'Sync service unavailable' }, 502);
    if (method === 'DELETE') return new Response(null, { status: 204, headers });
    const rows = await res.json();
    if (!rows.length)
      return reply(
        { error: method === 'PUT' ? 'A newer revision exists' : 'No vault found' },
        method === 'PUT' ? 409 : 404,
      );
    return reply(rows[0]);
  } catch {
    return reply({ error: 'Sync service unavailable' }, 502);
  }
}
export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const DELETE = handle;
