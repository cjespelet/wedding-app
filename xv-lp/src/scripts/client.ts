import { initDiscoBalls } from './disco-balls';
import { initPlaylist } from './playlist';

async function submitRsvp(
  form: HTMLFormElement,
  thanks: HTMLElement,
  error: HTMLElement | null,
  sendError: string,
): Promise<void> {
  const data = new FormData(form);
  const name = String(data.get('name') ?? '').trim();
  const coming = String(data.get('coming') ?? '');
  if (!name || !coming) {
    if (error) {
      error.textContent = error.dataset.required ?? error.textContent;
      error.classList.remove('hidden');
    }
    return;
  }
  error?.classList.add('hidden');

  const email = form.dataset.email?.trim();
  const submitBtn = form.querySelector<HTMLButtonElement>('[type="submit"]');
  if (submitBtn) submitBtn.disabled = true;

  if (email) {
    try {
      const res = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(email)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          nombre: name,
          viene: coming === 'si' ? 'Sí, va' : 'No puede ir',
          cuantos: String(data.get('count') ?? '1'),
          frase: String(data.get('phrase') ?? '').trim() || '(sin frase)',
          _subject: `RSVP XV — ${name}`,
          _template: 'table',
          _captcha: 'false',
        }),
      });
      const payload = (await res.json()) as { success?: string | boolean; message?: string };
      const sent = payload.success === true || payload.success === 'true';
      if (!sent) {
        const activating = /activat/i.test(payload.message ?? '');
        throw new Error(activating ? 'activate' : 'send');
      }
    } catch (err) {
      if (error) {
        const activateHint = form.dataset.activateHint ?? sendError;
        error.textContent = err instanceof Error && err.message === 'activate' ? activateHint : sendError;
        error.classList.remove('hidden');
      }
      if (submitBtn) submitBtn.disabled = false;
      return;
    }
  }

  form.classList.add('hidden');
  thanks.classList.remove('hidden');
}

function initReveal(): void {
  const els = document.querySelectorAll('.reveal');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) {
    els.forEach((el) => el.classList.add('is-visible'));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 },
  );
  els.forEach((el) => io.observe(el));
}

function initCountdown(): void {
  const root = document.getElementById('countdown-timer');
  if (!root) return;
  const iso = root.getAttribute('data-event-date');
  if (!iso) return;
  const target = new Date(iso).getTime();

  const set = (id: string, value: number) => {
    const node = document.getElementById(`cd-${id}`);
    if (node) node.textContent = String(Math.max(0, value)).padStart(2, '0');
  };

  const tick = () => {
    const diff = target - Date.now();
    if (diff <= 0) {
      set('days', 0);
      set('hours', 0);
      set('minutes', 0);
      set('seconds', 0);
      return;
    }
    set('days', Math.floor(diff / 86400000));
    set('hours', Math.floor((diff % 86400000) / 3600000));
    set('minutes', Math.floor((diff % 3600000) / 60000));
    set('seconds', Math.floor((diff % 60000) / 1000));
  };

  tick();
  window.setInterval(tick, 1000);
}

function initCopyAlias(): void {
  const btn = document.getElementById('copy-alias');
  if (!btn) return;
  const alias = btn.getAttribute('data-alias');
  const copied = btn.getAttribute('data-copied') ?? '¡Copiado!';
  const original = btn.textContent;
  btn.addEventListener('click', async () => {
    if (!alias) return;
    try {
      await navigator.clipboard.writeText(alias);
    } catch {
      /* clipboard can fail in some browsers; still show feedback */
    }
    btn.textContent = copied;
    window.setTimeout(() => {
      btn.textContent = original;
    }, 2000);
  });
}

function initRsvp(): void {
  const form = document.getElementById('rsvp-form');
  const thanks = document.getElementById('rsvp-thanks');
  const error = document.getElementById('rsvp-error');
  if (!(form instanceof HTMLFormElement) || !thanks) return;
  const sendError = form.dataset.sendError ?? 'No se pudo enviar.';

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    void submitRsvp(form, thanks, error, sendError);
  });

  form.querySelectorAll('input[name="coming"]').forEach((input) => {
    input.addEventListener('change', () => {
      form.querySelectorAll('input[name="coming"]').forEach((el) => {
        el.parentElement?.classList.remove('is-on');
      });
      if (input instanceof HTMLInputElement && input.checked) {
        input.parentElement?.classList.add('is-on');
      }
    });
  });
}

initReveal();
initCountdown();
initCopyAlias();
initRsvp();
initPlaylist();
initDiscoBalls();
