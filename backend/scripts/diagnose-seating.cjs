/**
 * Diagnóstico de asignación vs confirmados.
 * Usage: node scripts/diagnose-seating.cjs [apiBaseUrl] [email] [password]
 */
const API = (process.argv[2] || 'https://api.jesiyjavier.com.ar/api').replace(/\/$/, '');
const EMAIL = process.argv[3] || 'admin@boda.com';
const PASSWORD = process.argv[4] || '123456';

function confirmedTotal(g) {
  const r = g.rsvps?.[0];
  if (!r?.attending) return 0;
  if (r.confirmedAdults != null && r.confirmedMinors != null) return r.confirmedAdults + r.confirmedMinors;
  if (r.numberOfGuests != null) return r.numberOfGuests;
  return (g.adultsCount ?? 0) + (g.minorsCount ?? 0);
}

function seatsForSeating(g) {
  const r = g.rsvps?.[0];
  if (!r) return (g.adultsCount ?? 0) + (g.minorsCount ?? 0);
  if (!r.attending) return 0;
  if (r.confirmedAdults != null && r.confirmedMinors != null) return r.confirmedAdults + r.confirmedMinors;
  if (r.numberOfGuests != null) return r.numberOfGuests;
  return (r.confirmedAdults ?? g.adultsCount ?? 0) + (r.confirmedMinors ?? g.minorsCount ?? 0);
}

async function main() {
  const loginRes = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  if (!loginRes.ok) throw new Error(`Login ${loginRes.status}: ${await loginRes.text()}`);
  const { token } = await loginRes.json();

  const headers = { Authorization: `Bearer ${token}` };
  const [guestsRes, seatingRes, analyticsRes] = await Promise.all([
    fetch(`${API}/admin/guests`, { headers }),
    fetch(`${API}/admin/floor-plan/seating`, { headers }),
    fetch(`${API}/admin/analytics`, { headers }),
  ]);

  const guests = await guestsRes.json();
  const seating = await seatingRes.json();
  const analytics = await analyticsRes.json();

  const assignedIds = new Set();
  let assignedSeatsApi = 0;
  for (const t of seating.plan.tables) {
    for (const a of t.assignments || []) {
      assignedIds.add(a.guestId);
      assignedSeatsApi += a.seatsUsed;
    }
  }

  let confirmedSum = 0;
  let confirmedAssigned = 0;
  let confirmedUnassigned = 0;
  const unassignedByCategory = {};
  const assignedByCategory = {};

  for (const g of guests) {
    const c = confirmedTotal(g);
    if (c > 0) confirmedSum += c;
    const cat = (g.familyGroup || '').trim() || '(sin categoría)';
    const seats = seatsForSeating(g);
    if (assignedIds.has(g.id)) {
      if (c > 0) confirmedAssigned += c;
      assignedByCategory[cat] = assignedByCategory[cat] || { groups: 0, seats: 0, confirmed: 0 };
      assignedByCategory[cat].groups++;
      assignedByCategory[cat].seats += seats;
      assignedByCategory[cat].confirmed += c;
    } else if (seats > 0) {
      if (c > 0) confirmedUnassigned += c;
      unassignedByCategory[cat] = unassignedByCategory[cat] || { groups: 0, seats: 0, confirmed: 0 };
      unassignedByCategory[cat].groups++;
      unassignedByCategory[cat].seats += seats;
      unassignedByCategory[cat].confirmed += c;
    }
  }

  console.log('Analytics confirmedGuests:', analytics.confirmedGuests);
  console.log('Guest list confirmed sum:', confirmedSum);
  console.log('Seating stats:', seating.stats);
  console.log('Assigned seats (sum from API tables):', assignedSeatsApi);
  console.log('Confirmed on assigned groups:', confirmedAssigned);
  console.log('Confirmed on unassigned groups:', confirmedUnassigned);
  console.log('\n--- Unassigned by category (from guest list) ---');
  console.log(JSON.stringify(unassignedByCategory, null, 2));
  console.log('\n--- Assigned by category (sample) ---');
  console.log(JSON.stringify(assignedByCategory, null, 2));
  console.log('\n--- Unassigned in seating API ---');
  const apiUnassigned = {};
  for (const g of seating.unassigned) {
    const cat = (g.familyGroup || '').trim() || '(sin categoría)';
    apiUnassigned[cat] = (apiUnassigned[cat] || 0) + 1;
  }
  console.log(apiUnassigned);

  const amigosFliaUnassigned = guests.filter(
    (g) => !assignedIds.has(g.id) && /amigos.*flia/i.test(g.familyGroup || ''),
  );
  console.log('\n--- AMIGOS*FLIA unassigned (regex) ---');
  for (const g of amigosFliaUnassigned) {
    console.log(g.fullName, g.familyGroup, 'seats:', seatsForSeating(g), 'confirmed:', confirmedTotal(g));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
