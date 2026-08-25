import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export type TableShape = 'round' | 'rect' | 'square';
export type TableOccupancy = 'empty' | 'partial' | 'full' | 'over';

export interface TableAssignment {
  id: string;
  guestId: string;
  fullName: string;
  familyGroup?: string | null;
  seatsUsed: number;
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
  assignments?: TableAssignment[];
}

export interface FloorPlan {
  id: string;
  weddingId: string;
  widthCm: number;
  heightCm: number;
  tables: VenueTable[];
}

export interface UnassignedGuest {
  id: string;
  fullName: string;
  familyGroup?: string | null;
  adultsCount: number;
  minorsCount: number;
  seatsNeeded: number;
  seatsInvited?: number;
}

export interface SeatingStats {
  totalSeats: number;
  assignedSeats: number;
  unassignedGuests: number;
  unassignedSeats: number;
  assignedGuestGroups: number;
  totalGuestGroups: number;
  overCapacityTables: number;
}

export interface SeatingState {
  plan: FloorPlan;
  unassigned: UnassignedGuest[];
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

export const TABLE_SHAPE_LABELS: Record<TableShape, string> = {
  round: 'Redonda',
  rect: 'Rectangular',
  square: 'Cuadrada',
};

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
