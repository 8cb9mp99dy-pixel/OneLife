// Relays a published iCloud calendar feed to the app. Exists because
// iCloud's published-calendar URLs don't send CORS headers, so the
// browser can't fetch them directly and there is no other server in this
// project. Deployed by pasting this file into Supabase Dashboard → Edge
// Functions → Deploy new function, name: ical-proxy. Keep verify_jwt ON
// (the default) so only signed-in app requests can use it.
//
// Deliberately NOT an open proxy: only https requests to *.icloud.com
// are relayed, and only the response text comes back.

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  let target: string | undefined;
  try {
    const body = await req.json();
    target = body?.url;
  } catch {
    // fall through to the 400 below
  }
  if (!target) {
    return new Response('missing url', { status: 400, headers: CORS_HEADERS });
  }

  let parsed: URL;
  try {
    parsed = new URL(target.replace(/^webcal:/i, 'https:'));
  } catch {
    return new Response('invalid url', { status: 400, headers: CORS_HEADERS });
  }

  const allowedHost = parsed.hostname === 'icloud.com' || parsed.hostname.endsWith('.icloud.com');
  if (parsed.protocol !== 'https:' || !allowedHost) {
    return new Response('only icloud.com calendar urls are allowed', {
      status: 400,
      headers: CORS_HEADERS,
    });
  }

  const upstream = await fetch(parsed.toString());
  if (!upstream.ok) {
    return new Response(`upstream error ${upstream.status}`, {
      status: 502,
      headers: CORS_HEADERS,
    });
  }

  const text = await upstream.text();
  return new Response(text, {
    headers: { ...CORS_HEADERS, 'Content-Type': 'text/plain; charset=utf-8' },
  });
});
