import { prisma } from '../db/prisma.js';

export const TABLE_SHAPES = ['round', 'rect', 'square'] as const;
export type TableShape = (typeof TABLE_SHAPES)[number];

export function normalizeTableShape(value?: string): TableShape {
  const normalized = value?.trim().toLowerCase();
  if (normalized && TABLE_SHAPES.includes(normalized as TableShape)) {
    return normalized as TableShape;
  }
  return 'round';
}

export function defaultTableSize(shape: TableShape): { widthCm: number; heightCm: number } {
  switch (shape) {
    case 'square':
      return { widthCm: 150, heightCm: 150 };
    case 'rect':
      return { widthCm: 220, heightCm: 120 };
    default:
      return { widthCm: 150, heightCm: 150 };
  }
}

export async function getOrCreateFloorPlan(weddingId: string) {
  const existing = await prisma.floorPlan.findUnique({
    where: { weddingId },
    include: {
      tables: {
        orderBy: { number: 'asc' },
      },
    },
  });

  if (existing) return existing;

  return prisma.floorPlan.create({
    data: {
      weddingId,
      widthCm: 1200,
      heightCm: 800,
    },
    include: {
      tables: {
        orderBy: { number: 'asc' },
      },
    },
  });
}

export function clampTablePosition(
  xCm: number,
  yCm: number,
  widthCm: number,
  heightCm: number,
  roomWidthCm: number,
  roomHeightCm: number,
): { xCm: number; yCm: number } {
  const halfW = widthCm / 2;
  const halfH = heightCm / 2;
  return {
    xCm: Math.min(Math.max(xCm, halfW), roomWidthCm - halfW),
    yCm: Math.min(Math.max(yCm, halfH), roomHeightCm - halfH),
  };
}

export async function nextTableNumber(floorPlanId: string): Promise<number> {
  const last = await prisma.venueTable.findFirst({
    where: { floorPlanId },
    orderBy: { number: 'desc' },
    select: { number: true },
  });
  return last ? last.number + 1 : 1;
}

export function guestSeatsNeeded(guest: { adultsCount: number; minorsCount: number }): number {
  return (guest.adultsCount ?? 0) + (guest.minorsCount ?? 0);
}

export function normalizeGuestCategory(familyGroup: string | null | undefined): string | null {
  const value = familyGroup?.trim();
  return value || null;
}

export function uncategorizedGuestFilter() {
  return { OR: [{ familyGroup: null }, { familyGroup: '' }] };
}

export function guestMatchesCategory(
  familyGroup: string | null | undefined,
  category: string,
): boolean {
  if (category === '__uncategorized__') {
    return !normalizeGuestCategory(familyGroup);
  }
  return normalizeGuestCategory(familyGroup) === category;
}

export type TableOccupancy = 'empty' | 'partial' | 'full' | 'over';

export function tableOccupancy(seatsUsed: number, seatCount: number): TableOccupancy {
  if (seatsUsed <= 0) return 'empty';
  if (seatsUsed > seatCount) return 'over';
  if (seatsUsed === seatCount) return 'full';
  return 'partial';
}
