import { Pipe, PipeTransform } from '@angular/core';

/**
 * Converts an ISO date string (e.g. from the API) to a Date representing that
 * calendar day in local time. Avoids timezone shift: "2026-09-26T00:00:00.000Z"
 * would otherwise show as 25 in UTC-3; this pipe ensures 26 is shown.
 */
@Pipe({ name: 'localDate', standalone: true })
export class LocalDatePipe implements PipeTransform {
  transform(value: string | Date | null | undefined): Date | null {
    if (value == null) return null;
    const str = typeof value === 'string' ? value : value.toISOString();
    const match = str.substring(0, 10).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return null;
    const [, y, m, d] = match;
    return new Date(parseInt(y!, 10), parseInt(m!, 10) - 1, parseInt(d!, 10));
  }
}
