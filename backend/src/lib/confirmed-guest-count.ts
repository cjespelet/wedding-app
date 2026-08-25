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

/** Cupos para mesas: confirmados si RSVP; invitados si aún no respondió; 0 si declinó. */
export function guestSeatsForSeating(guest: GuestWithLatestRsvp): number {
  const rsvp = guest.rsvps[0];
  if (!rsvp) {
    return (guest.adultsCount ?? 0) + (guest.minorsCount ?? 0);
  }
  if (!rsvp.attending) return 0;

  if (rsvp.confirmedAdults != null && rsvp.confirmedMinors != null) {
    return rsvp.confirmedAdults + rsvp.confirmedMinors;
  }
  if (rsvp.numberOfGuests != null) {
    return rsvp.numberOfGuests;
  }

  const adults = rsvp.confirmedAdults ?? guest.adultsCount ?? 0;
  const minors = rsvp.confirmedMinors ?? guest.minorsCount ?? 0;
  return adults + minors;
}

export function guestSeatsInvited(guest: { adultsCount: number; minorsCount: number }): number {
  return (guest.adultsCount ?? 0) + (guest.minorsCount ?? 0);
}

export function sumConfirmedGuests(guests: GuestWithLatestRsvp[]): number {
  return guests.reduce((sum, guest) => {
    const counts = confirmedCountsFromGuest(guest);
    return counts ? sum + counts.total : sum;
  }, 0);
}
