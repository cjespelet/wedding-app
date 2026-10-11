import http from 'node:http';
import { exec } from 'node:child_process';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

const REDIRECT = 'http://127.0.0.1:8888/callback';
const SCOPES = ['playlist-modify-public', 'playlist-modify-private', 'playlist-read-private'].join(' ');

function openUrl(url) {
  const cmd =
    process.platform === 'win32'
      ? `start "" "${url}"`
      : process.platform === 'darwin'
        ? `open "${url}"`
        : `xdg-open "${url}"`;
  exec(cmd);
}

function ask(rl, label) {
  return rl.question(`${label}: `).then((v) => v.trim());
}

const rl = createInterface({ input, output });
const clientId = await ask(rl, 'Spotify Client ID');
const clientSecret = await ask(rl, 'Spotify Client Secret');
rl.close();

if (!clientId || !clientSecret) {
  console.error('Need both Client ID and Client Secret.');
  process.exit(1);
}

const authUrl = new URL('https://accounts.spotify.com/authorize');
authUrl.searchParams.set('client_id', clientId);
authUrl.searchParams.set('response_type', 'code');
authUrl.searchParams.set('redirect_uri', REDIRECT);
authUrl.searchParams.set('scope', SCOPES);
authUrl.searchParams.set('show_dialog', 'true');

const token = await new Promise((resolve, reject) => {
  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? '/', REDIRECT);
      if (url.pathname !== '/callback') {
        res.writeHead(404);
        res.end();
        return;
      }
      const code = url.searchParams.get('code');
      const err = url.searchParams.get('error');
      if (err || !code) {
        res.writeHead(400, { 'Content-Type': 'text/plain' });
        res.end(err || 'Missing code');
        server.close();
        reject(new Error(err || 'Missing code'));
        return;
      }

      const body = new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT,
      });
      const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body,
      });
      const data = await tokenRes.json();
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end('<p>Listo. Ya podés cerrar esta pestaña y volver a la terminal.</p>');
      server.close();
      if (!data.refresh_token) {
        reject(new Error(data.error_description || 'No refresh token'));
        return;
      }
      resolve(data.refresh_token);
    } catch (error) {
      server.close();
      reject(error);
    }
  });
  server.listen(8888, '127.0.0.1', () => {
    console.log('\nOpening Spotify login…');
    console.log(authUrl.toString());
    openUrl(authUrl.toString());
  });
});

console.log('\nRefresh token (keep private):\n');
console.log(token);
console.log('\nNext:');
console.log('  cd xv-lp/spotify-api');
console.log('  npx wrangler login');
console.log('  npx wrangler secret put SPOTIFY_CLIENT_ID');
console.log('  npx wrangler secret put SPOTIFY_CLIENT_SECRET');
console.log('  npx wrangler secret put SPOTIFY_REFRESH_TOKEN');
console.log('  # set SPOTIFY_PLAYLIST_ID in wrangler.toml');
console.log('  npx wrangler deploy');
