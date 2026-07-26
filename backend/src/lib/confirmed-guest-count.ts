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

  const adults = rsvp.confirmedAdults ?? guest.adultsCount;
  const minors = rsvp.confirmedMinors ?? guest.minorsCount;
  return { adults, minors, total: adults + minors };
}

export function sumConfirmedGuests(guests: GuestWithLatestRsvp[]): number {
  return guests.reduce((sum, guest) => {
    const counts = confirmedCountsFromGuest(guest);
    return counts ? sum + counts.total : sum;
  }, 0);
}
