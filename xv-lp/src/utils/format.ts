const DOW = ['Dom.', 'Lun.', 'Mar.', 'Mié.', 'Jue.', 'Vie.', 'Sáb.'] as const;
const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'] as const;

export function heroDateParts(iso: string): { dow: string; day: string; month: string } {
  const parts = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  const d = parts
    ? new Date(`${parts[1]}-${parts[2]}-${parts[3]}T12:00:00-03:00`)
    : new Date(iso);
  return {
    dow: DOW[d.getDay()],
    day: String(d.getDate()).padStart(2, '0'),
    month: `${MONTHS[d.getMonth()]} ${d.getFullYear()}`,
  };
}

export function googleCalendarUrl(
  title: string,
  startIso: string,
  location: string,
  details: string,
): string {
  const start = new Date(startIso);
  const end = new Date(start.getTime() + 5 * 60 * 60 * 1000);
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${fmt(start)}/${fmt(end)}`,
    details,
    location,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function appleCalendarUrl(
  title: string,
  startIso: string,
  location: string,
  details: string,
): string {
  const start = new Date(startIso);
  const end = new Date(start.getTime() + 5 * 60 * 60 * 1000);
  const stamp = (d: Date) =>
    d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'BEGIN:VEVENT',
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${details}`,
    `LOCATION:${location}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\n');
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`;
}
