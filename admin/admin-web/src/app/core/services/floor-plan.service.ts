import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export type TableShape = 'round' | 'rect' | 'square';
export type TableOccupancy = 'empty' | 'partial' | 'full' | 'over';
export type ElementKind = 'bar' | 'chopera' | 'dj' | 'food_serving';

export interface FloorPlanElement {
  id: string;
  floorPlanId: string;
  kind: ElementKind;
  label: string | null;
  xCm: number;
  yCm: number;
  rotationDeg: number;
  widthCm: number;
  heightCm: number;
}

export interface TableAssignment {
  id: string;
  guestId: string;
  fullName: string;
  familyGroup?: string | null;
  seatsUsed: number;
  seatsConfirmed?: number;
  seatsInvited?: number;
}

export interface VenueTable {
  id: string;
  floorPlanId: string;
  number: number;
  shape: TableShape;
  xCm: number;
  yCm: number;
  rotationDeg: number;
  widthCm: number;
  heightCm: number;
  seatCount: number;
  seatsUsed?: number;
  seatsConfirmed?: number;
  assignments?: TableAssignment[];
}

export interface FloorPlan {
  id: string;
  weddingId: string;
  widthCm: number;
  heightCm: number;
  tables: VenueTable[];
  elements?: FloorPlanElement[];
}

export interface UnassignedGuest {
  id: string;
  fullName: string;
  familyGroup?: string | null;
  adultsCount: number;
  minorsCount: number;
  seatsNeeded: number;
  seatsConfirmed?: number;
  seatsInvited?: number;
}

export interface CategorySeatSummary {
  groups: number;
  confirmedSeats: number;
  operationalSeats: number;
}

export interface SeatingStats {
  totalTableSeats: number;
  assignedSeats: number;
  unassignedGuests: number;
  unassignedSeats: number;
  confirmedTotal: number;
  confirmedAssignedSeats: number;
  confirmedUnassignedSeats: number;
  assignedGuestGroups: number;
  totalGuestGroups: number;
  overCapacityTables: number;
}

export interface SeatingState {
  plan: FloorPlan;
  unassigned: UnassignedGuest[];
  assignedByCategory: Record<string, CategorySeatSummary>;
  unassignedByCategory: Record<string, CategorySeatSummary>;
  stats: SeatingStats;
}

export type CreateTablePayload = {
  shape: TableShape;
  number?: number;
  xCm?: number;
  yCm?: number;
  rotationDeg?: number;
  widthCm?: number;
  heightCm?: number;
  seatCount?: number;
};

export type UpdateTablePayload = Partial<CreateTablePayload>;

export type CreateElementPayload = {
  kind: ElementKind;
  label?: string;
  xCm?: number;
  yCm?: number;
  rotationDeg?: number;
  widthCm?: number;
  heightCm?: number;
};

export type UpdateElementPayload = Partial<CreateElementPayload>;

export const TABLE_SHAPE_LABELS: Record<TableShape, string> = {
  round: 'Redonda',
  rect: 'Rectangular',
  square: 'Cuadrada',
};

export const ELEMENT_KIND_LABELS: Record<ElementKind, string> = {
  bar: 'Barra de tragos',
  chopera: 'Chopera',
  dj: 'DJ',
  food_serving: 'Mesa de comida',
};

export const ELEMENT_KINDS: ElementKind[] = ['bar', 'chopera', 'dj', 'food_serving'];

export function tableOccupancy(table: VenueTable): TableOccupancy {
  const used = table.seatsUsed ?? 0;
  if (used <= 0) return 'empty';
  if (used > table.seatCount) return 'over';
  if (used === table.seatCount) return 'full';
  return 'partial';
}

@Injectable({ providedIn: 'root' })
export class FloorPlanService {
  constructor(private http: HttpClient) {}

  get() {
    return this.http.get<FloorPlan>(`${environment.apiBaseUrl}/admin/floor-plan`);
  }

  getSeating() {
    return this.http.get<SeatingState>(`${environment.apiBaseUrl}/admin/floor-plan/seating`);
  }

  updateRoom(widthCm: number, heightCm: number) {
    return this.http.put<FloorPlan>(`${environment.apiBaseUrl}/admin/floor-plan`, { widthCm, heightCm });
  }

  createTable(payload: CreateTablePayload) {
    return this.http.post<VenueTable>(`${environment.apiBaseUrl}/admin/floor-plan/tables`, payload);
  }

  updateTable(id: string, payload: UpdateTablePayload) {
    return this.http.put<VenueTable>(`${environment.apiBaseUrl}/admin/floor-plan/tables/${id}`, payload);
  }

  removeTable(id: string) {
    return this.http.delete<void>(`${environment.apiBaseUrl}/admin/floor-plan/tables/${id}`);
  }

  createElement(payload: CreateElementPayload) {
    return this.http.post<FloorPlanElement>(`${environment.apiBaseUrl}/admin/floor-plan/elements`, payload);
  }

  updateElement(id: string, payload: UpdateElementPayload) {
    return this.http.put<FloorPlanElement>(`${environment.apiBaseUrl}/admin/floor-plan/elements/${id}`, payload);
  }

  removeElement(id: string) {
    return this.http.delete<void>(`${environment.apiBaseUrl}/admin/floor-plan/elements/${id}`);
  }

  assignGuest(guestId: string, tableId: string) {
    return this.http.post<TableAssignment & { tableId: string }>(
      `${environment.apiBaseUrl}/admin/floor-plan/assign`,
      { guestId, tableId },
    );
  }

  unassignGuest(guestId: string) {
    return this.http.delete<void>(`${environment.apiBaseUrl}/admin/floor-plan/assign/${guestId}`);
  }

  assignCategory(category: string, tableId: string) {
    return this.http.post<{
      assignedGroups: number;
      assignedSeats: number;
      skippedGroups?: number;
      partial?: boolean;
      tableId: string;
      category: string;
    }>(`${environment.apiBaseUrl}/admin/floor-plan/assign-category`, { category, tableId });
  }
}
