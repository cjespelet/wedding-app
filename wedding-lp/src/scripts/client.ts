interface WeddingWindow extends Window {
  whatsapp?: { enabled: boolean; phone: string; message: string };
  coupleName?: string;
  shareCopied?: string;
}

const win = window as WeddingWindow;
const whatsapp = win.whatsapp ?? { enabled: false, phone: '', message: '' };
const coupleName = win.coupleName ?? '';
const shareCopied = win.shareCopied ?? 'Enlace copiado';

function initScrollReveal(): void {
  const prefersReduced = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;
  const elements = document.querySelectorAll('.reveal');

  const show = (el: Element): void => {
    el.classList.add('is-visible');
  };

  const isInViewport = (el: Element): boolean => {
    const rect = el.getBoundingClientRect();
    return rect.top < window.innerHeight * 0.92 && rect.bottom > 0;
  };

  if (prefersReduced) {
    elements.forEach(show);
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          show(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.05, rootMargin: '0px 0px 5% 0px' }
  );

  elements.forEach((el) => {
    if (isInViewport(el)) {
      show(el);
    } else {
      observer.observe(el);
    }
  });
}

function initScrollProgress(): void {
  const bar = document.getElementById('scroll-progress');
  if (!bar) return;

  window.addEventListener(
    'scroll',
    () => {
      const scrollTop = window.scrollY;
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? scrollTop / docHeight : 0;
      bar.style.transform = `scaleX(${progress})`;
    },
    { passive: true }
  );
}

function initBackToTop(): void {
  const btn = document.getElementById('back-to-top');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    btn.classList.toggle('opacity-0', window.scrollY < 400);
    btn.classList.toggle('pointer-events-none', window.scrollY < 400);
    btn.classList.toggle('opacity-100', window.scrollY >= 400);
    btn.classList.toggle('pointer-events-auto', window.scrollY >= 400);
  });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

function initShare(): void {
  const btn = document.getElementById('share-btn');
  const originalText = btn?.textContent ?? '';

  btn?.addEventListener('click', async () => {
    const url = window.location.href;
    const text =
      document.querySelector('meta[name="description"]')?.getAttribute('content') ?? '';

    if (navigator.share) {
      try {
        await navigator.share({ title: coupleName, text, url });
        return;
      } catch {
        /* fallback */
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      if (btn) btn.textContent = shareCopied;
      window.setTimeout(() => {
        if (btn) btn.textContent = originalText;
      }, 2500);
    } catch {
      /* ignore */
    }
  });
}

function initGallery(): void {
  const lightbox = document.getElementById('lightbox');
  const img = document.getElementById('lightbox-img') as HTMLImageElement | null;
  const items = Array.from(
    document.querySelectorAll<HTMLButtonElement>('[data-gallery-index]')
  );
  let current = 0;

  function show(index: number): void {
    if (!lightbox || !img || !items.length) return;
    current = (index + items.length) % items.length;
    const item = items[current];
    img.src = item.getAttribute('data-src') ?? '';
    img.alt = item.getAttribute('data-alt') ?? '';
    img.style.transform = 'scale(0.95)';
    requestAnimationFrame(() => {
      img.style.transform = 'scale(1)';
    });
    lightbox.hidden = false;
    lightbox.classList.remove('opacity-0', 'pointer-events-none');
    lightbox.classList.add('opacity-100', 'pointer-events-auto');
    document.body.style.overflow = 'hidden';
  }

  function hide(): void {
    if (!lightbox) return;
    lightbox.classList.add('opacity-0', 'pointer-events-none');
    lightbox.classList.remove('opacity-100', 'pointer-events-auto');
    lightbox.hidden = true;
    document.body.style.overflow = '';
  }

  items.forEach((item, i) => {
    item.addEventListener('click', () => show(i));
  });

  document.getElementById('lightbox-close')?.addEventListener('click', hide);
  document.getElementById('lightbox-prev')?.addEventListener('click', () =>
    show(current - 1)
  );
  document.getElementById('lightbox-next')?.addEventListener('click', () =>
    show(current + 1)
  );

  lightbox?.addEventListener('click', (e) => {
    if (e.target === lightbox) hide();
  });

  document.addEventListener('keydown', (e) => {
    if (lightbox?.hidden) return;
    if (e.key === 'Escape') hide();
    if (e.key === 'ArrowLeft') show(current - 1);
    if (e.key === 'ArrowRight') show(current + 1);
  });
}

function initMusic(): void {
  const player = document.getElementById('music-player');
  const toggle = document.getElementById('music-toggle');
  const audio = document.getElementById('wedding-audio') as HTMLAudioElement | null;
  const playIcon = document.getElementById('music-icon-play');
  const pauseIcon = document.getElementById('music-icon-pause');

  if (!toggle || !audio) return;

  audio.setAttribute('playsinline', '');

  const setPlaying = (playing: boolean): void => {
    playIcon?.classList.toggle('hidden', playing);
    pauseIcon?.classList.toggle('hidden', !playing);
    toggle.setAttribute('aria-pressed', playing ? 'true' : 'false');
  };

  const playFromGesture = (): void => {
    audio.muted = false;
    const promise = audio.play();
    if (promise !== undefined) {
      promise
        .then(() => setPlaying(true))
        .catch(() => setPlaying(false));
    } else if (!audio.paused) {
      setPlaying(true);
    }
  };

  toggle.addEventListener('click', () => {
    if (audio.paused) {
      playFromGesture();
    } else {
      audio.pause();
      audio.muted = false;
      setPlaying(false);
    }
  });

  const autoplay = player?.getAttribute('data-autoplay') === 'true';
  if (!autoplay) return;

  let interactionBound = false;

  const unbindInteraction = (): void => {
    if (!interactionBound) return;
    interactionBound = false;
    document.removeEventListener('pointerdown', onFirstInteraction, true);
    document.removeEventListener('touchstart', onFirstInteraction, true);
    document.removeEventListener('click', onFirstInteraction, true);
    document.removeEventListener('keydown', onFirstInteraction, true);
  };

  const onFirstInteraction = (): void => {
    if (!audio.paused && audio.muted) {
      audio.muted = false;
      setPlaying(true);
      unbindInteraction();
      return;
    }
    if (!audio.paused) {
      unbindInteraction();
      return;
    }
    playFromGesture();
    unbindInteraction();
  };

  const bindInteraction = (): void => {
    if (interactionBound) return;
    interactionBound = true;
    document.addEventListener('pointerdown', onFirstInteraction, true);
    document.addEventListener('touchstart', onFirstInteraction, true);
    document.addEventListener('click', onFirstInteraction, true);
    document.addEventListener('keydown', onFirstInteraction, true);
  };

  const tryMutedAutoplay = (): void => {
    audio.muted = true;
    audio
      .play()
      .then(() => {
        setPlaying(true);
        bindInteraction();
      })
      .catch(() => {
        audio.muted = false;
        bindInteraction();
      });
  };

  audio.muted = false;
  audio
    .play()
    .then(() => {
      setPlaying(true);
    })
    .catch(() => {
      tryMutedAutoplay();
    });
}

function initWhatsApp(): void {
  if (!whatsapp?.enabled || !whatsapp.phone) return;

  const text = encodeURIComponent(whatsapp.message);
  const href = `https://wa.me/${whatsapp.phone}?text=${text}`;

  const link = document.createElement('a');
  link.href = href;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.className =
    'fixed bottom-20 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-105 sm:bottom-24 sm:right-8';
  link.setAttribute('aria-label', 'WhatsApp');
  link.innerHTML = `<svg class="h-7 w-7" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.89-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>`;
  document.body.appendChild(link);
}

function init(): void {
  initScrollReveal();
  initScrollProgress();
  initBackToTop();
  initShare();
  initGallery();
  initMusic();
  initWhatsApp();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
