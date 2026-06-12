const LOCALE = 'es-AR';

export function formatWeddingDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString(LOCALE, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatShortDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString(LOCALE, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatStoryDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString(LOCALE, {
    month: 'long',
    year: 'numeric',
  });
}

export function formatTime(time: string): string {
  if (time.includes('hs')) return time;
  return `${time} hs`;
}

export function googleCalendarUrl(
  title: string,
  startIso: string,
  location: string,
  details: string
): string {
  const start = new Date(startIso);
  const end = new Date(start.getTime() + 4 * 60 * 60 * 1000);
  const fmt = (d: Date) =>
    d
      .toISOString()
      .replace(/[-:]/g, '')
      .replace(/\.\d{3}/, '');

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${fmt(start)}/${fmt(end)}`,
    details,
    location,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
