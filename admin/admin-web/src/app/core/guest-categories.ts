export const GUEST_CATEGORIES = [
  'AMIGOS JAVI',
  'AMIGOS JESI',
  'AMIGOS FLIA',
  'FLIA JESI',
  'FLIA JAVI',
  'MESA PRINCIPAL',
] as const;

export type GuestCategory = (typeof GUEST_CATEGORIES)[number];

/** Valor enviado a la API para invitados sin categoría */
export const UNCATEGORIZED_CATEGORY = '__uncategorized__';

export function normalizeGuestCategory(familyGroup: string | null | undefined): string | null {
  const value = familyGroup?.trim();
  return value || null;
}

/** Categorías predefinidas + las que existen en invitados sin mesa. */
export function collectAssignableCategoryLabels(
  guests: { familyGroup?: string | null }[],
  predefined: readonly string[] = GUEST_CATEGORIES,
): string[] {
  const labels = new Set<string>(predefined);

  for (const guest of guests) {
    const category = normalizeGuestCategory(guest.familyGroup);
    if (category) labels.add(category);
  }

  return [...labels].sort((a, b) => {
    const aIndex = predefined.indexOf(a);
    const bIndex = predefined.indexOf(b);
    if (aIndex >= 0 && bIndex >= 0) return aIndex - bIndex;
    if (aIndex >= 0) return -1;
    if (bIndex >= 0) return 1;
    return a.localeCompare(b, 'es');
  });
}
