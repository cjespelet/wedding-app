type GuestWithLatestRsvp = {
  adultsCount: number;
  minorsCount: number;
  rsvps: Array<{
    attending: boolean;
    numberOfGuests: number;
    confirmedAdults: number | null;
    confirmedMinors: number | null;
  }>;
};

export function confirmedCountsFromGuest(guest: GuestWithLatestRsvp): {
  adults: number;
  minors: number;
  total: number;
} | null {
  const rsvp = guest.rsvps[0];
  if (!rsvp?.attending) return null;

  if (rsvp.confirmedAdults != null && rsvp.confirmedMinors != null) {
    return {
      adults: rsvp.confirmedAdults,
      minors: rsvp.confirmedMinors,
      total: rsvp.confirmedAdults + rsvp.confirmedMinors,
    };
  }

  if (rsvp.numberOfGuests != null) {
    const adults = rsvp.confirmedAdults ?? rsvp.numberOfGuests;
    const minors = rsvp.confirmedMinors ?? 0;
    const total =
      rsvp.confirmedAdults != null || rsvp.confirmedMinors != null
        ? adults + minors
        : rsvp.numberOfGuests;
    return { adults, minors, total };
  }

  const adults = rsvp.confirmedAdults ?? guest.adultsCount;
  const minors = rsvp.confirmedMinors ?? guest.minorsCount;
  return { adults, minors, total: adults + minors };
}

export function guestSeatsInvited(guest: { adultsCount: number; minorsCount: number }): number {
  return (guest.adultsCount ?? 0) + (guest.minorsCount ?? 0);
}

/** Personas confirmadas por RSVP (0 si no confirmó o declinó). */
export function guestConfirmedSeats(guest: GuestWithLatestRsvp): number {
  return confirmedCountsFromGuest(guest)?.total ?? 0;
}

/** Cupos en el salón: solo invitados con RSVP confirmado. */
export function guestOperationalSeats(guest: GuestWithLatestRsvp): number {
  return guestConfirmedSeats(guest);
}

export function isGuestEligibleForSeating(guest: GuestWithLatestRsvp): boolean {
  return guestConfirmedSeats(guest) > 0;
}

/** @deprecated Use guestOperationalSeats or guestConfirmedSeats explicitly */
export function guestSeatsForSeating(guest: GuestWithLatestRsvp): number {
  return guestOperationalSeats(guest);
}

export type CategorySeatSummary = {
  groups: number;
  confirmedSeats: number;
  operationalSeats: number;
};

export function summarizeGuestsByCategory(
  guests: Array<GuestWithLatestRsvp & { familyGroup?: string | null }>,
): Record<string, CategorySeatSummary> {
  const summary: Record<string, CategorySeatSummary> = {};
  for (const guest of guests) {
    const label = normalizeGuestCategory(guest.familyGroup) ?? 'Sin categoría';
    const bucket = summary[label] ?? { groups: 0, confirmedSeats: 0, operationalSeats: 0 };
    bucket.groups += 1;
    bucket.confirmedSeats += guestConfirmedSeats(guest);
    bucket.operationalSeats += guestOperationalSeats(guest);
    summary[label] = bucket;
  }
  return summary;
}

function normalizeGuestCategory(familyGroup: string | null | undefined): string | null {
  const value = familyGroup?.trim();
  return value || null;
}

export function sumConfirmedGuests(guests: GuestWithLatestRsvp[]): number {
  return guests.reduce((sum, guest) => {
    const counts = confirmedCountsFromGuest(guest);
    return counts ? sum + counts.total : sum;
  }, 0);
}
