import { execSync } from 'node:child_process';
import { mkdtempSync, rmSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const REPO = 'xv-delfi';
const SRC = dirname(dirname(fileURLToPath(import.meta.url)));

function gitCred() {
  const raw = execSync('git credential fill', {
    input: 'protocol=https\nhost=github.com\n\n',
    encoding: 'utf8',
  });
  const map = Object.fromEntries(
    raw
      .trim()
      .split(/\r?\n/)
      .map((line) => {
        const i = line.indexOf('=');
        return [line.slice(0, i), line.slice(i + 1)];
      }),
  );
  if (!map.username || !map.password) throw new Error('No GitHub credentials');
  return map;
}

const cred = gitCred();
const authHeader = `Basic ${Buffer.from(`${cred.username}:${cred.password}`).toString('base64')}`;

async function gh(path, init = {}) {
  const res = await fetch(`https://api.github.com${path}`, {
    ...init,
    headers: {
      Authorization: authHeader,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'xv-publish',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...init.headers,
    },
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  return { ok: res.ok, status: res.status, data };
}

const created = await gh('/user/repos', {
  method: 'POST',
  body: JSON.stringify({
    name: REPO,
    description: 'Invitación de los XV de Delfi',
    homepage: `https://${cred.username}.github.io/${REPO}/`,
    private: false,
    has_issues: false,
    has_projects: false,
    has_wiki: false,
  }),
});

if (!created.ok && created.status !== 422) {
  console.error('Could not create repo:', created.status, created.data.message || created.data);
  process.exit(1);
}

const owner = created.data.owner?.login || cred.username;
console.log(created.status === 422 ? `Repo already exists: ${owner}/${REPO}` : `Created ${owner}/${REPO}`);

const dest = mkdtempSync(join(tmpdir(), 'xv-delfi-'));
try {
  execSync(`robocopy "${SRC}" "${dest}" /E /XD node_modules dist .astro .wrangler /XF .env .env.production /NFL /NDL /NJH /NJS /NP`, {
    stdio: 'ignore',
  });
} catch (err) {
  const code = err.status ?? err.code;
  if (code > 7) {
    console.error('Copy failed');
    process.exit(1);
  }
}

if (!existsSync(join(dest, 'package.json'))) {
  console.error('Copy missing package.json');
  process.exit(1);
}

const git = (args) => execSync(`git ${args}`, { cwd: dest, stdio: 'inherit' });
git('init -b main');
git('add -A');
git('commit -m "Publish the XV invitation on its own GitHub Pages site."');
execSync(`git remote add origin https://github.com/${owner}/${REPO}.git`, { cwd: dest });
execSync(`git -c http.extraheader="AUTHORIZATION: basic ${Buffer.from(`${cred.username}:${cred.password}`).toString('base64')}" push -u origin main`, {
  cwd: dest,
  stdio: 'inherit',
});

const pages = await gh(`/repos/${owner}/${REPO}/pages`, {
  method: 'POST',
  body: JSON.stringify({ build_type: 'workflow' }),
});
if (pages.ok) console.log('GitHub Pages set to GitHub Actions');
else if (pages.status === 409) console.log('GitHub Pages already enabled');
else console.log('Enable Pages in Settings → Pages → GitHub Actions if the first deploy fails.');

console.log(`https://${owner}.github.io/${REPO}/`);
rmSync(dest, { recursive: true, force: true });
