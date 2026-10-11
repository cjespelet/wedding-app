const SPOTIFY_ACCOUNTS = 'https://accounts.spotify.com/api/token';
const SPOTIFY_API = 'https://api.spotify.com/v1';

function corsHeaders(origin, allowed) {
  const ok = allowed.includes('*') || allowed.includes(origin);
  return {
    'Access-Control-Allow-Origin': ok ? origin || '*' : allowed[0] || '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

function json(data, status, cors) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...cors },
  });
}

async function accessToken(env) {
  const res = await fetch(SPOTIFY_ACCOUNTS, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${btoa(`${env.SPOTIFY_CLIENT_ID}:${env.SPOTIFY_CLIENT_SECRET}`)}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: env.SPOTIFY_REFRESH_TOKEN,
    }),
  });
  const data = await res.json();
  if (!res.ok || !data.access_token) {
    throw new Error(data.error_description || data.error || 'spotify token');
  }
  return data.access_token;
}

async function spotify(env, path, init = {}) {
  const token = await accessToken(env);
  const res = await fetch(`${SPOTIFY_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...init.headers,
    },
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) {
    throw new Error(data.error?.message || data.error_description || `spotify ${res.status}`);
  }
  return data;
}

export default {
  async fetch(request, env) {
    const allowed = String(env.ALLOWED_ORIGINS || '*')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const cors = corsHeaders(request.headers.get('Origin') || '', allowed);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    const url = new URL(request.url);

    try {
      if (request.method === 'GET' && url.pathname === '/search') {
        const q = url.searchParams.get('q')?.trim() ?? '';
        if (q.length < 2) return json({ tracks: [] }, 200, cors);
        const data = await spotify(
          env,
          `/search?${new URLSearchParams({ q, type: 'track', limit: '6', market: 'AR' })}`,
        );
        const tracks = (data.tracks?.items ?? []).map((item) => ({
          id: item.id,
          uri: item.uri,
          name: item.name,
          artists: (item.artists ?? []).map((a) => a.name).join(', '),
          image: item.album?.images?.[1]?.url || item.album?.images?.[0]?.url || '',
        }));
        return json({ tracks }, 200, cors);
      }

      if (request.method === 'POST' && url.pathname === '/add') {
        const body = await request.json();
        const uri = typeof body?.uri === 'string' ? body.uri.trim() : '';
        if (!uri.startsWith('spotify:track:')) {
          return json({ error: 'uri' }, 400, cors);
        }
        const playlistId = env.SPOTIFY_PLAYLIST_ID;
        if (!playlistId) return json({ error: 'playlist' }, 500, cors);
        await spotify(env, `/playlists/${encodeURIComponent(playlistId)}/items`, {
          method: 'POST',
          body: JSON.stringify({ uris: [uri] }),
        });
        return json({ ok: true }, 200, cors);
      }

      return json({ error: 'not found' }, 404, cors);
    } catch (err) {
      return json({ error: err instanceof Error ? err.message : 'spotify' }, 502, cors);
    }
  },
};
