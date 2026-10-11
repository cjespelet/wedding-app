type Track = {
  id: string;
  name: string;
  artists: string;
  image: string;
};

const ASKED_KEY = 'xv-playlist-asked';

function loadAsked(): Set<string> {
  try {
    const raw = localStorage.getItem(ASKED_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function saveAsked(ids: Set<string>): void {
  localStorage.setItem(ASKED_KEY, JSON.stringify([...ids]));
}

async function searchSongs(query: string): Promise<Track[]> {
  const url = new URL('https://itunes.apple.com/search');
  url.searchParams.set('term', query);
  url.searchParams.set('media', 'music');
  url.searchParams.set('entity', 'song');
  url.searchParams.set('limit', '6');
  url.searchParams.set('country', 'AR');
  const res = await fetch(url);
  const data = (await res.json()) as {
    results?: { trackId: number; trackName: string; artistName: string; artworkUrl100?: string }[];
  };
  return (data.results ?? []).map((item) => ({
    id: String(item.trackId),
    name: item.trackName,
    artists: item.artistName,
    image: (item.artworkUrl100 ?? '').replace('100x100', '200x200'),
  }));
}

export function initPlaylist(): void {
  const box = document.getElementById('playlist-box');
  const input = document.getElementById('pl-q');
  const list = document.getElementById('pl-results');
  const status = document.getElementById('pl-status');
  if (!(box && input instanceof HTMLInputElement && list && status)) return;

  const email = box.dataset.email?.trim() ?? '';
  const labels = {
    ask: box.dataset.ask ?? 'Pedir',
    asking: box.dataset.asking ?? 'Pidiendo…',
    asked: box.dataset.asked ?? 'Pedido',
    empty: box.dataset.empty ?? 'No encontramos ese tema.',
  };
  const asked = loadAsked();
  let timer: number | undefined;

  const render = (tracks: Track[]) => {
    list.replaceChildren();
    for (const track of tracks) {
      const li = document.createElement('li');
      li.className = 'pl-row';

      const img = track.image ? document.createElement('img') : document.createElement('span');
      if (img instanceof HTMLImageElement) {
        img.src = track.image;
        img.alt = '';
        img.loading = 'lazy';
      }
      img.className = 'pl-cover';

      const meta = document.createElement('div');
      meta.className = 'pl-meta';
      const title = document.createElement('b');
      title.textContent = track.name;
      const artist = document.createElement('span');
      artist.textContent = track.artists;
      meta.append(title, artist);

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'pl-add';
      const markAsked = () => {
        btn.classList.add('is-done');
        btn.disabled = true;
        btn.textContent = labels.asked;
      };
      if (asked.has(track.id)) markAsked();
      else btn.textContent = labels.ask;

      btn.addEventListener('click', async () => {
        if (btn.disabled) return;
        btn.disabled = true;
        btn.textContent = labels.asking;
        try {
          if (email) {
            const res = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(email)}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
              body: JSON.stringify({
                tipo: 'Pedido de canción',
                tema: track.name,
                artista: track.artists,
                _subject: `Canción XV — ${track.name}`,
                _template: 'table',
                _captcha: 'false',
              }),
            });
            const payload = (await res.json()) as { success?: string | boolean };
            const ok = payload.success === true || payload.success === 'true';
            if (!ok) throw new Error('send');
          }
          asked.add(track.id);
          saveAsked(asked);
          markAsked();
        } catch {
          btn.disabled = false;
          btn.textContent = labels.ask;
        }
      });

      li.append(img, meta, btn);
      list.append(li);
    }
  };

  input.addEventListener('input', () => {
    window.clearTimeout(timer);
    const q = input.value.trim();
    if (q.length < 2) {
      list.replaceChildren();
      status.textContent = '';
      return;
    }
    timer = window.setTimeout(async () => {
      status.textContent = 'Buscando…';
      try {
        const tracks = await searchSongs(q);
        status.textContent = tracks.length ? '' : labels.empty;
        render(tracks);
      } catch {
        status.textContent = labels.empty;
      }
    }, 350);
  });
}
