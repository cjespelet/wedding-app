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
