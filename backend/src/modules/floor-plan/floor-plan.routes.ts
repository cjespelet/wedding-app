import { Router } from 'express';
import { prisma } from '../../db/prisma.js';
import { requireAuth, type AuthenticatedRequest } from '../../middleware/auth.js';
import {
  guestConfirmedSeats,
  guestOperationalSeats,
  guestSeatsInvited,
  isGuestEligibleForSeating,
  summarizeGuestsByCategory,
  sumConfirmedGuests,
} from '../../lib/confirmed-guest-count.js';
import {
  clampTablePosition,
  defaultElementSize,
  defaultElementLabel,
  defaultTableSize,
  ELEMENT_KINDS,
  getOrCreateFloorPlan,
  nextTableNumber,
  normalizeElementKind,
  normalizeTableShape,
  guestMatchesCategory,
  TABLE_SHAPES,
} from '../../lib/floor-plan.js';

const latestRsvpSelect = {
  orderBy: { createdAt: 'desc' as const },
  take: 1,
  select: {
    attending: true,
    numberOfGuests: true,
    confirmedAdults: true,
    confirmedMinors: true,
  },
};

const guestSeatingSelect = {
  id: true,
  fullName: true,
  familyGroup: true,
  adultsCount: true,
  minorsCount: true,
  rsvps: latestRsvpSelect,
} as const;

export const floorPlanRouter = Router();

floorPlanRouter.get('/', requireAuth(['super_admin', 'wedding_admin']), async (req: AuthenticatedRequest, res) => {
  const weddingId = req.user?.weddingId;
  if (!weddingId) {
    return res.status(400).json({ error: 'No weddingId on token' });
  }

  const plan = await getOrCreateFloorPlan(weddingId);
  return res.json(plan);
});

floorPlanRouter.put('/', requireAuth(['super_admin', 'wedding_admin']), async (req: AuthenticatedRequest, res) => {
  const weddingId = req.user?.weddingId;
  if (!weddingId) {
    return res.status(400).json({ error: 'No weddingId on token' });
  }

  const { widthCm, heightCm } = req.body as { widthCm?: number; heightCm?: number };
  if (widthCm == null || heightCm == null || widthCm < 100 || heightCm < 100) {
    return res.status(400).json({ error: 'widthCm and heightCm must be at least 100' });
  }

  const plan = await getOrCreateFloorPlan(weddingId);
  const updated = await prisma.floorPlan.update({
    where: { id: plan.id },
    data: { widthCm, heightCm },
    include: {
      tables: { orderBy: { number: 'asc' } },
      elements: { orderBy: { createdAt: 'asc' } },
    },
  });

  const clampedTables = await Promise.all(
    updated.tables.map(async (table) => {
      const pos = clampTablePosition(
        table.xCm,
        table.yCm,
        table.widthCm,
        table.heightCm,
        updated.widthCm,
        updated.heightCm,
      );
      if (pos.xCm === table.xCm && pos.yCm === table.yCm) return table;
      return prisma.venueTable.update({
        where: { id: table.id },
        data: pos,
      });
    }),
  );

  const clampedElements = await Promise.all(
    updated.elements.map(async (element) => {
      const pos = clampTablePosition(
        element.xCm,
        element.yCm,
        element.widthCm,
        element.heightCm,
        updated.widthCm,
        updated.heightCm,
      );
      if (pos.xCm === element.xCm && pos.yCm === element.yCm) return element;
      return prisma.floorPlanElement.update({
        where: { id: element.id },
        data: pos,
      });
    }),
  );

  return res.json({
    ...updated,
    tables: clampedTables.sort((a, b) => a.number - b.number),
    elements: clampedElements,
  });
});

floorPlanRouter.post('/tables', requireAuth(['super_admin', 'wedding_admin']), async (req: AuthenticatedRequest, res) => {
  const weddingId = req.user?.weddingId;
  if (!weddingId) {
    return res.status(400).json({ error: 'No weddingId on token' });
  }

  const {
    shape,
    number,
    xCm,
    yCm,
    rotationDeg,
    widthCm,
    heightCm,
    seatCount,
  } = req.body as {
    shape?: string;
    number?: number;
    xCm?: number;
    yCm?: number;
    rotationDeg?: number;
    widthCm?: number;
    heightCm?: number;
    seatCount?: number;
  };

  const plan = await getOrCreateFloorPlan(weddingId);
  const normalizedShape = normalizeTableShape(shape);
  const defaults = defaultTableSize(normalizedShape);
  const tableWidth = widthCm ?? defaults.widthCm;
  const tableHeight = heightCm ?? defaults.heightCm;
  const tableNumber = number ?? (await nextTableNumber(plan.id));

  if (tableNumber < 1) {
    return res.status(400).json({ error: 'number must be positive' });
  }

  const duplicate = await prisma.venueTable.findUnique({
    where: {
      floorPlanId_number: {
        floorPlanId: plan.id,
        number: tableNumber,
      },
    },
  });
  if (duplicate) {
    return res.status(409).json({ error: `Ya existe la mesa ${tableNumber}` });
  }

  const centerX = xCm ?? plan.widthCm / 2;
  const centerY = yCm ?? plan.heightCm / 2;
  const pos = clampTablePosition(centerX, centerY, tableWidth, tableHeight, plan.widthCm, plan.heightCm);

  const created = await prisma.venueTable.create({
    data: {
      floorPlanId: plan.id,
      number: tableNumber,
      shape: normalizedShape,
      xCm: pos.xCm,
      yCm: pos.yCm,
      rotationDeg: rotationDeg ?? 0,
      widthCm: tableWidth,
      heightCm: tableHeight,
      seatCount: seatCount != null && seatCount > 0 ? seatCount : 8,
    },
  });

  return res.status(201).json(created);
});

floorPlanRouter.put('/tables/:id', requireAuth(['super_admin', 'wedding_admin']), async (req: AuthenticatedRequest, res) => {
  const weddingId = req.user?.weddingId;
  if (!weddingId) {
    return res.status(400).json({ error: 'No weddingId on token' });
  }

  const { id } = req.params;
  const plan = await getOrCreateFloorPlan(weddingId);
  const existing = await prisma.venueTable.findFirst({
    where: { id, floorPlanId: plan.id },
  });
  if (!existing) {
    return res.status(404).json({ error: 'Mesa no encontrada' });
  }

  const {
    shape,
    number,
    xCm,
    yCm,
    rotationDeg,
    widthCm,
    heightCm,
    seatCount,
  } = req.body as {
    shape?: string;
    number?: number;
    xCm?: number;
    yCm?: number;
    rotationDeg?: number;
    widthCm?: number;
    heightCm?: number;
    seatCount?: number;
  };

  const nextShape = shape != null ? normalizeTableShape(shape) : existing.shape;
  const nextWidth = widthCm ?? existing.widthCm;
  const nextHeight = heightCm ?? existing.heightCm;
  const nextX = xCm ?? existing.xCm;
  const nextY = yCm ?? existing.yCm;
  const pos = clampTablePosition(nextX, nextY, nextWidth, nextHeight, plan.widthCm, plan.heightCm);

  if (number != null && number !== existing.number) {
    const duplicate = await prisma.venueTable.findUnique({
      where: {
        floorPlanId_number: {
          floorPlanId: plan.id,
          number,
        },
      },
    });
    if (duplicate) {
      return res.status(409).json({ error: `Ya existe la mesa ${number}` });
    }
  }

  const updated = await prisma.venueTable.update({
    where: { id },
    data: {
      shape: nextShape,
      number: number ?? existing.number,
      xCm: pos.xCm,
      yCm: pos.yCm,
      rotationDeg: rotationDeg ?? existing.rotationDeg,
      widthCm: nextWidth,
      heightCm: nextHeight,
      seatCount: seatCount != null && seatCount > 0 ? seatCount : existing.seatCount,
    },
  });

  return res.json(updated);
});

floorPlanRouter.delete('/tables/:id', requireAuth(['super_admin', 'wedding_admin']), async (req: AuthenticatedRequest, res) => {
  const weddingId = req.user?.weddingId;
  if (!weddingId) {
    return res.status(400).json({ error: 'No weddingId on token' });
  }

  const { id } = req.params;
  const plan = await getOrCreateFloorPlan(weddingId);
  const existing = await prisma.venueTable.findFirst({
    where: { id, floorPlanId: plan.id },
  });
  if (!existing) {
    return res.status(404).json({ error: 'Mesa no encontrada' });
  }

  await prisma.venueTable.delete({ where: { id } });
  return res.status(204).end();
});

floorPlanRouter.post('/elements', requireAuth(['super_admin', 'wedding_admin']), async (req: AuthenticatedRequest, res) => {
  const weddingId = req.user?.weddingId;
  if (!weddingId) {
    return res.status(400).json({ error: 'No weddingId on token' });
  }

  const { kind, label, xCm, yCm, rotationDeg, widthCm, heightCm } = req.body as {
    kind?: string;
    label?: string;
    xCm?: number;
    yCm?: number;
    rotationDeg?: number;
    widthCm?: number;
    heightCm?: number;
  };

  const plan = await getOrCreateFloorPlan(weddingId);
  const normalizedKind = normalizeElementKind(kind);
  const defaults = defaultElementSize(normalizedKind);
  const elementWidth = widthCm ?? defaults.widthCm;
  const elementHeight = heightCm ?? defaults.heightCm;
  const centerX = xCm ?? plan.widthCm / 2;
  const centerY = yCm ?? plan.heightCm / 2;
  const pos = clampTablePosition(centerX, centerY, elementWidth, elementHeight, plan.widthCm, plan.heightCm);

  const created = await prisma.floorPlanElement.create({
    data: {
      floorPlanId: plan.id,
      kind: normalizedKind,
      label: label?.trim() || defaultElementLabel(normalizedKind),
      xCm: pos.xCm,
      yCm: pos.yCm,
      rotationDeg: rotationDeg ?? 0,
      widthCm: elementWidth,
      heightCm: elementHeight,
    },
  });

  return res.status(201).json(created);
});

floorPlanRouter.put('/elements/:id', requireAuth(['super_admin', 'wedding_admin']), async (req: AuthenticatedRequest, res) => {
  const weddingId = req.user?.weddingId;
  if (!weddingId) {
    return res.status(400).json({ error: 'No weddingId on token' });
  }

  const { id } = req.params;
  const plan = await getOrCreateFloorPlan(weddingId);
  const existing = await prisma.floorPlanElement.findFirst({
    where: { id, floorPlanId: plan.id },
  });
  if (!existing) {
    return res.status(404).json({ error: 'Elemento no encontrado' });
  }

  const { kind, label, xCm, yCm, rotationDeg, widthCm, heightCm } = req.body as {
    kind?: string;
    label?: string;
    xCm?: number;
    yCm?: number;
    rotationDeg?: number;
    widthCm?: number;
    heightCm?: number;
  };

  const nextKind = kind != null ? normalizeElementKind(kind) : existing.kind;
  const nextWidth = widthCm ?? existing.widthCm;
  const nextHeight = heightCm ?? existing.heightCm;
  const nextX = xCm ?? existing.xCm;
  const nextY = yCm ?? existing.yCm;
  const pos = clampTablePosition(nextX, nextY, nextWidth, nextHeight, plan.widthCm, plan.heightCm);

  const updated = await prisma.floorPlanElement.update({
    where: { id },
    data: {
      kind: nextKind,
      label: label !== undefined ? label.trim() || defaultElementLabel(normalizeElementKind(nextKind)) : existing.label,
      xCm: pos.xCm,
      yCm: pos.yCm,
      rotationDeg: rotationDeg ?? existing.rotationDeg,
      widthCm: nextWidth,
      heightCm: nextHeight,
    },
  });

  return res.json(updated);
});

floorPlanRouter.delete('/elements/:id', requireAuth(['super_admin', 'wedding_admin']), async (req: AuthenticatedRequest, res) => {
  const weddingId = req.user?.weddingId;
  if (!weddingId) {
    return res.status(400).json({ error: 'No weddingId on token' });
  }

  const { id } = req.params;
  const plan = await getOrCreateFloorPlan(weddingId);
  const existing = await prisma.floorPlanElement.findFirst({
    where: { id, floorPlanId: plan.id },
  });
  if (!existing) {
    return res.status(404).json({ error: 'Elemento no encontrado' });
  }

  await prisma.floorPlanElement.delete({ where: { id } });
  return res.status(204).end();
});

floorPlanRouter.get('/meta/shapes', requireAuth(['super_admin', 'wedding_admin']), (_req, res) => {
  return res.json({ shapes: TABLE_SHAPES });
});

floorPlanRouter.get('/meta/elements', requireAuth(['super_admin', 'wedding_admin']), (_req, res) => {
  return res.json({ kinds: ELEMENT_KINDS });
});

floorPlanRouter.get('/seating', requireAuth(['super_admin', 'wedding_admin']), async (req: AuthenticatedRequest, res) => {
  const weddingId = req.user?.weddingId;
  if (!weddingId) {
    return res.status(400).json({ error: 'No weddingId on token' });
  }

  const plan = await getOrCreateFloorPlan(weddingId);
  const tables = await prisma.venueTable.findMany({
    where: { floorPlanId: plan.id },
    orderBy: { number: 'asc' },
    include: {
      assignments: {
        include: {
          guest: {
            select: guestSeatingSelect,
          },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  const assignedGuestIds = new Set<string>();
  let assignedSeats = 0;
  let overCapacityTables = 0;

  const tablesWithAssignments = tables.map((table) => {
    const confirmedAssignments = table.assignments.filter((a) =>
      isGuestEligibleForSeating(a.guest),
    );
    const assignmentRows = confirmedAssignments.map((a) => ({
      id: a.id,
      guestId: a.guestId,
      fullName: a.guest.fullName,
      familyGroup: a.guest.familyGroup,
      seatsUsed: guestConfirmedSeats(a.guest),
      seatsConfirmed: guestConfirmedSeats(a.guest),
      seatsInvited: guestSeatsInvited(a.guest),
    }));
    const seatsUsed = assignmentRows.reduce((sum, a) => sum + a.seatsUsed, 0);
    const seatsConfirmed = seatsUsed;
    assignedSeats += seatsUsed;
    if (seatsUsed > table.seatCount) overCapacityTables += 1;
    confirmedAssignments.forEach((a) => assignedGuestIds.add(a.guestId));

    return {
      id: table.id,
      floorPlanId: table.floorPlanId,
      number: table.number,
      shape: table.shape,
      xCm: table.xCm,
      yCm: table.yCm,
      rotationDeg: table.rotationDeg,
      widthCm: table.widthCm,
      heightCm: table.heightCm,
      seatCount: table.seatCount,
      seatsUsed,
      seatsConfirmed,
      assignments: assignmentRows,
    };
  });

  const unassignedGuests = await prisma.guest.findMany({
    where: {
      weddingId,
      isSystemGuest: false,
      tableAssignment: null,
    },
    orderBy: { fullName: 'asc' },
    select: guestSeatingSelect,
  });

  const unassignedForSeating = unassignedGuests.filter((g) => isGuestEligibleForSeating(g));
  const allGuests = await prisma.guest.findMany({
    where: { weddingId, isSystemGuest: false },
    select: guestSeatingSelect,
  });

  const confirmedGuests = allGuests.filter((g) => isGuestEligibleForSeating(g));
  const assignedGuests = confirmedGuests.filter((g) => assignedGuestIds.has(g.id));
  const totalTableSeats = tables.reduce((sum, t) => sum + t.seatCount, 0);
  const operationalAssignedSeats = assignedSeats;
  const operationalUnassignedSeats = unassignedForSeating.reduce(
    (sum, g) => sum + guestConfirmedSeats(g),
    0,
  );
  const confirmedTotal = sumConfirmedGuests(allGuests);
  const confirmedAssignedSeats = assignedGuests.reduce((sum, g) => sum + guestConfirmedSeats(g), 0);
  const confirmedUnassignedSeats = operationalUnassignedSeats;
  const totalGuestGroups = confirmedGuests.length;

  return res.json({
    plan: {
      id: plan.id,
      weddingId: plan.weddingId,
      widthCm: plan.widthCm,
      heightCm: plan.heightCm,
      tables: tablesWithAssignments,
      elements: plan.elements ?? [],
    },
    unassigned: unassignedForSeating.map((g) => ({
      id: g.id,
      fullName: g.fullName,
      familyGroup: g.familyGroup,
      adultsCount: g.adultsCount,
      minorsCount: g.minorsCount,
      seatsNeeded: guestConfirmedSeats(g),
      seatsConfirmed: guestConfirmedSeats(g),
      seatsInvited: guestSeatsInvited(g),
    })),
    assignedByCategory: summarizeGuestsByCategory(assignedGuests),
    unassignedByCategory: summarizeGuestsByCategory(unassignedForSeating),
    stats: {
      totalTableSeats,
      assignedSeats: operationalAssignedSeats,
      unassignedGuests: unassignedForSeating.length,
      unassignedSeats: operationalUnassignedSeats,
      confirmedTotal,
      confirmedAssignedSeats,
      confirmedUnassignedSeats,
      assignedGuestGroups: assignedGuestIds.size,
      totalGuestGroups,
      overCapacityTables,
    },
  });
});

floorPlanRouter.post('/assign', requireAuth(['super_admin', 'wedding_admin']), async (req: AuthenticatedRequest, res) => {
  const weddingId = req.user?.weddingId;
  if (!weddingId) {
    return res.status(400).json({ error: 'No weddingId on token' });
  }

  const { guestId, tableId } = req.body as { guestId?: string; tableId?: string };
  if (!guestId || !tableId) {
    return res.status(400).json({ error: 'guestId and tableId are required' });
  }

  const guest = await prisma.guest.findFirst({
    where: { id: guestId, weddingId, isSystemGuest: false },
    select: guestSeatingSelect,
  });
  if (!guest) {
    return res.status(404).json({ error: 'Invitado no encontrado' });
  }

  const plan = await getOrCreateFloorPlan(weddingId);
  const table = await prisma.venueTable.findFirst({
    where: { id: tableId, floorPlanId: plan.id },
    include: {
      assignments: {
        include: {
          guest: { select: guestSeatingSelect },
        },
      },
    },
  });
  if (!table) {
    return res.status(404).json({ error: 'Mesa no encontrada' });
  }

  const seatsUsed = guestConfirmedSeats(guest);
  if (seatsUsed < 1) {
    return res.status(400).json({ error: 'Solo se pueden asignar invitados con RSVP confirmado' });
  }

  const otherSeats = table.assignments
    .filter((a) => a.guestId !== guestId && isGuestEligibleForSeating(a.guest))
    .reduce((sum, a) => sum + guestConfirmedSeats(a.guest), 0);

  if (otherSeats + seatsUsed > table.seatCount) {
    return res.status(409).json({
      error: `Mesa ${table.number} no tiene capacidad (${otherSeats + seatsUsed}/${table.seatCount})`,
    });
  }

  const assignment = await prisma.tableAssignment.upsert({
    where: { guestId },
    create: { guestId, tableId, seatsUsed },
    update: { tableId, seatsUsed },
    include: {
      guest: {
        select: { fullName: true, familyGroup: true },
      },
    },
  });

  return res.json({
    id: assignment.id,
    guestId: assignment.guestId,
    tableId: assignment.tableId,
    fullName: assignment.guest.fullName,
    familyGroup: assignment.guest.familyGroup,
    seatsUsed: assignment.seatsUsed,
  });
});

floorPlanRouter.delete('/assign/:guestId', requireAuth(['super_admin', 'wedding_admin']), async (req: AuthenticatedRequest, res) => {
  const weddingId = req.user?.weddingId;
  if (!weddingId) {
    return res.status(400).json({ error: 'No weddingId on token' });
  }

  const { guestId } = req.params;
  const guest = await prisma.guest.findFirst({
    where: { id: guestId, weddingId },
    include: { tableAssignment: true },
  });
  if (!guest?.tableAssignment) {
    return res.status(404).json({ error: 'Asignación no encontrada' });
  }

  await prisma.tableAssignment.delete({ where: { guestId } });
  return res.status(204).end();
});

floorPlanRouter.post(
  '/assign-category',
  requireAuth(['super_admin', 'wedding_admin']),
  async (req: AuthenticatedRequest, res) => {
    const weddingId = req.user?.weddingId;
    if (!weddingId) {
      return res.status(400).json({ error: 'No weddingId on token' });
    }

    const { category, tableId } = req.body as { category?: string; tableId?: string };
    if (!tableId) {
      return res.status(400).json({ error: 'tableId is required' });
    }
    if (category == null || category === '') {
      return res.status(400).json({ error: 'category is required' });
    }

    const plan = await getOrCreateFloorPlan(weddingId);
    const table = await prisma.venueTable.findFirst({
      where: { id: tableId, floorPlanId: plan.id },
      include: {
        assignments: {
          include: {
            guest: { select: guestSeatingSelect },
          },
        },
      },
    });
    if (!table) {
      return res.status(404).json({ error: 'Mesa no encontrada' });
    }

    const isUncategorized = category === '__uncategorized__';
    const unassignedPool = await prisma.guest.findMany({
      where: {
        weddingId,
        isSystemGuest: false,
        tableAssignment: null,
      },
      orderBy: { fullName: 'asc' },
      select: guestSeatingSelect,
    });
    const guests = unassignedPool.filter(
      (guest) =>
        isGuestEligibleForSeating(guest) &&
        guestMatchesCategory(guest.familyGroup, isUncategorized ? '__uncategorized__' : category),
    );

    if (guests.length === 0) {
      return res.status(404).json({ error: 'No hay invitados sin mesa en esa categoría' });
    }

    const seatsUsedOnTable = table.assignments
      .filter((a) => isGuestEligibleForSeating(a.guest))
      .reduce((sum, a) => sum + guestConfirmedSeats(a.guest), 0);
    let seatsAvailable = table.seatCount - seatsUsedOnTable;
    const toAssign: typeof guests = [];

    for (const guest of guests) {
      const need = guestConfirmedSeats(guest);
      if (need <= seatsAvailable) {
        toAssign.push(guest);
        seatsAvailable -= need;
      }
    }

    if (toAssign.length === 0) {
      return res.status(409).json({
        error: `Mesa ${table.number} no tiene capacidad para ningún grupo de esta categoría`,
      });
    }

    const assignedSeatsCount = toAssign.reduce((sum, g) => sum + guestConfirmedSeats(g), 0);

    await prisma.$transaction(
      toAssign.map((guest) =>
        prisma.tableAssignment.create({
          data: {
            guestId: guest.id,
            tableId,
            seatsUsed: guestConfirmedSeats(guest),
          },
        }),
      ),
    );

    const skippedGroups = guests.length - toAssign.length;

    return res.json({
      tableId,
      category,
      assignedGroups: toAssign.length,
      assignedSeats: assignedSeatsCount,
      skippedGroups,
      partial: skippedGroups > 0,
    });
  },
);
