import { Component, ElementRef, HostListener, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import {
  FloorPlan,
  FloorPlanService,
  SeatingState,
  TABLE_SHAPE_LABELS,
  TableOccupancy,
  TableShape,
  UnassignedGuest,
  VenueTable,
  tableOccupancy,
} from '../../core/services/floor-plan.service';
import { GUEST_CATEGORIES, normalizeGuestCategory, UNCATEGORIZED_CATEGORY } from '../../core/guest-categories';

type SalonMode = 'plan' | 'assign';
type AssignMethod = 'category' | 'guest';
type CategoryFilter = 'all' | 'uncategorized' | (typeof GUEST_CATEGORIES)[number];

export interface CategorySummary {
  key: string;
  label: string;
  groups: number;
  seats: number;
}

export interface TableCanvasSummary {
  groups: number;
  seats: number;
  categoryLabels: string[];
}

@Component({
  standalone: true,
  selector: 'app-salon-page',
  templateUrl: './salon.page.html',
  styleUrls: ['./salon.page.scss'],
  imports: [CommonModule, FormsModule, MatButtonModule, MatSnackBarModule],
})
export class SalonPage implements OnInit {
  private readonly floorPlanService = inject(FloorPlanService);
  private readonly snackBar = inject(MatSnackBar);

  @ViewChild('floorSvg') floorSvgRef?: ElementRef<SVGSVGElement>;

  mode: SalonMode = 'plan';
  assignMethod: AssignMethod = 'category';
  plan: FloorPlan | null = null;
  seating: SeatingState | null = null;
  loading = true;
  savingRoom = false;
  widthM = 12;
  heightM = 8;
  selectedTableId: string | null = null;
  categoryFilter: CategoryFilter = 'all';
  readonly shapeLabels = TABLE_SHAPE_LABELS;
  readonly tableShapes: TableShape[] = ['round', 'rect', 'square'];
  readonly categories = GUEST_CATEGORIES;

  private draggingTableId: string | null = null;
  private dragOffsetX = 0;
  private dragOffsetY = 0;

  ngOnInit(): void {
    this.loadPlan();
  }

  get selectedTable(): VenueTable | null {
    if (!this.plan || !this.selectedTableId) return null;
    return this.plan.tables.find((t) => t.id === this.selectedTableId) ?? null;
  }

  get filteredUnassigned(): UnassignedGuest[] {
    const list = this.seating?.unassigned ?? [];
    if (this.categoryFilter === 'all') return list;
    if (this.categoryFilter === 'uncategorized') {
      return list.filter((g) => !normalizeGuestCategory(g.familyGroup));
    }
    return list.filter((g) => normalizeGuestCategory(g.familyGroup) === this.categoryFilter);
  }

  get categorySummaries(): CategorySummary[] {
    const list = this.seating?.unassigned ?? [];
    const summaries: CategorySummary[] = [];

    for (const category of this.categories) {
      const guests = list.filter((g) => normalizeGuestCategory(g.familyGroup) === category);
      if (guests.length === 0) continue;
      summaries.push({
        key: category,
        label: category,
        groups: guests.length,
        seats: guests.reduce((sum, g) => sum + g.seatsNeeded, 0),
      });
    }

    const uncategorized = list.filter((g) => !normalizeGuestCategory(g.familyGroup));
    if (uncategorized.length > 0) {
      summaries.push({
        key: UNCATEGORIZED_CATEGORY,
        label: 'Sin categoría',
        groups: uncategorized.length,
        seats: uncategorized.reduce((sum, g) => sum + g.seatsNeeded, 0),
      });
    }

    return summaries;
  }

  get onlyUncategorizedPending(): boolean {
    const summaries = this.categorySummaries;
    return summaries.length === 1 && summaries[0]?.key === UNCATEGORIZED_CATEGORY;
  }

  setAssignMethod(method: AssignMethod): void {
    this.assignMethod = method;
  }

  setMode(mode: SalonMode): void {
    if (this.mode === mode) return;
    this.mode = mode;
    this.selectedTableId = null;
    if (mode === 'assign') {
      this.loadSeating();
    } else {
      this.loadPlan();
    }
  }

  loadPlan(): void {
    this.loading = true;
    this.floorPlanService.get().subscribe({
      next: (plan) => {
        this.plan = plan;
        this.widthM = plan.widthCm / 100;
        this.heightM = plan.heightCm / 100;
        this.loading = false;
      },
      error: (err) => this.handleLoadError(err),
    });
  }

  loadSeating(): void {
    this.loading = true;
    this.floorPlanService.getSeating().subscribe({
      next: (seating) => {
        this.seating = seating;
        this.plan = seating.plan;
        this.widthM = seating.plan.widthCm / 100;
        this.heightM = seating.plan.heightCm / 100;
        this.loading = false;
      },
      error: (err) => this.handleLoadError(err),
    });
  }

  saveRoom(): void {
    if (!this.plan) return;
    const widthCm = Math.round(this.widthM * 100);
    const heightCm = Math.round(this.heightM * 100);
    if (widthCm < 100 || heightCm < 100) {
      this.snackBar.open('El salón debe medir al menos 1 × 1 m', 'Cerrar', { duration: 3000 });
      return;
    }

    this.savingRoom = true;
    this.floorPlanService.updateRoom(widthCm, heightCm).subscribe({
      next: (plan) => {
        this.plan = plan;
        this.widthM = plan.widthCm / 100;
        this.heightM = plan.heightCm / 100;
        this.savingRoom = false;
        this.snackBar.open('Salón actualizado', 'Cerrar', { duration: 2500 });
      },
      error: (err) => {
        this.savingRoom = false;
        this.snackBar.open(err?.error?.error || 'Error al guardar salón', 'Cerrar', { duration: 4000 });
      },
    });
  }

  addTable(shape: TableShape): void {
    this.floorPlanService.createTable({ shape }).subscribe({
      next: (table) => {
        this.plan?.tables.push(table);
        this.plan?.tables.sort((a, b) => a.number - b.number);
        this.selectedTableId = table.id;
        this.snackBar.open(`Mesa ${table.number} agregada`, 'Cerrar', { duration: 2000 });
      },
      error: (err) => {
        this.snackBar.open(err?.error?.error || 'Error al crear mesa', 'Cerrar', { duration: 4000 });
      },
    });
  }

  selectTable(table: VenueTable, event?: Event): void {
    event?.stopPropagation();
    this.selectedTableId = table.id;
  }

  clearSelection(): void {
    this.selectedTableId = null;
  }

  startDrag(event: PointerEvent, table: VenueTable): void {
    if (this.mode !== 'plan' || !this.plan) return;
    event.preventDefault();
    event.stopPropagation();
    this.selectTable(table);
    this.draggingTableId = table.id;

    const svg = this.floorSvgRef?.nativeElement;
    if (!svg) return;

    const point = this.clientToSvg(svg, event.clientX, event.clientY);
    this.dragOffsetX = point.x - table.xCm;
    this.dragOffsetY = point.y - table.yCm;
    (event.target as Element).setPointerCapture?.(event.pointerId);
  }

  @HostListener('document:pointermove', ['$event'])
  onPointerMove(event: PointerEvent): void {
    if (this.mode !== 'plan' || !this.draggingTableId || !this.plan) return;
    const svg = this.floorSvgRef?.nativeElement;
    if (!svg) return;

    const table = this.plan.tables.find((t) => t.id === this.draggingTableId);
    if (!table) return;

    const point = this.clientToSvg(svg, event.clientX, event.clientY);
    table.xCm = point.x - this.dragOffsetX;
    table.yCm = point.y - this.dragOffsetY;
  }

  @HostListener('document:pointerup')
  onPointerUp(): void {
    if (this.mode !== 'plan' || !this.draggingTableId || !this.plan) return;
    const table = this.plan.tables.find((t) => t.id === this.draggingTableId);
    this.draggingTableId = null;
    if (!table) return;

    this.floorPlanService.updateTable(table.id, { xCm: table.xCm, yCm: table.yCm }).subscribe({
      error: () => {
        this.snackBar.open('Error al guardar posición', 'Cerrar', { duration: 3000 });
        this.loadPlan();
      },
    });
  }

  saveSelectedTable(): void {
    const table = this.selectedTable;
    if (!table) return;

    this.floorPlanService
      .updateTable(table.id, {
        number: table.number,
        shape: table.shape,
        seatCount: table.seatCount,
        widthCm: table.widthCm,
        heightCm: table.heightCm,
        rotationDeg: table.rotationDeg,
        xCm: table.xCm,
        yCm: table.yCm,
      })
      .subscribe({
        next: (updated) => {
          const idx = this.plan?.tables.findIndex((t) => t.id === updated.id) ?? -1;
          if (idx >= 0 && this.plan) {
            this.plan.tables[idx] = { ...this.plan.tables[idx], ...updated };
            this.plan.tables.sort((a, b) => a.number - b.number);
          }
          this.snackBar.open('Mesa actualizada', 'Cerrar', { duration: 2000 });
          if (this.mode === 'assign') this.loadSeating();
        },
        error: (err) => {
          this.snackBar.open(err?.error?.error || 'Error al actualizar mesa', 'Cerrar', { duration: 4000 });
          this.mode === 'assign' ? this.loadSeating() : this.loadPlan();
        },
      });
  }

  deleteSelectedTable(): void {
    const table = this.selectedTable;
    if (!table || !confirm(`¿Eliminar mesa ${table.number}?`)) return;

    this.floorPlanService.removeTable(table.id).subscribe({
      next: () => {
        if (this.plan) {
          this.plan.tables = this.plan.tables.filter((t) => t.id !== table.id);
        }
        this.selectedTableId = null;
        this.snackBar.open('Mesa eliminada', 'Cerrar', { duration: 2000 });
        if (this.mode === 'assign') this.loadSeating();
      },
      error: (err) => {
        this.snackBar.open(err?.error?.error || 'Error al eliminar mesa', 'Cerrar', { duration: 4000 });
      },
    });
  }

  assignGuest(guest: UnassignedGuest): void {
    const table = this.selectedTable;
    if (!table) {
      this.snackBar.open('Seleccioná una mesa en el plano', 'Cerrar', { duration: 2500 });
      return;
    }

    this.floorPlanService.assignGuest(guest.id, table.id).subscribe({
      next: () => {
        this.snackBar.open(`${guest.fullName} → mesa ${table.number}`, 'Cerrar', { duration: 2000 });
        this.loadSeating();
      },
      error: (err) => {
        this.snackBar.open(err?.error?.error || 'No se pudo asignar', 'Cerrar', { duration: 4000 });
      },
    });
  }

  assignCategory(summary: CategorySummary): void {
    const table = this.selectedTable;
    if (!table) {
      this.snackBar.open('Seleccioná una mesa en el plano', 'Cerrar', { duration: 2500 });
      return;
    }

    this.floorPlanService.assignCategory(summary.key, table.id).subscribe({
      next: (result) => {
        let message = `${summary.label}: ${result.assignedGroups} grupo(s) → mesa ${table.number}`;
        if (result.partial && result.skippedGroups) {
          message += `. Quedan ${result.skippedGroups} grupo(s) sin mesa (mesa llena)`;
        }
        this.snackBar.open(message, 'Cerrar', { duration: 4000 });
        this.loadSeating();
      },
      error: (err) => {
        this.snackBar.open(err?.error?.error || 'No se pudo asignar la categoría', 'Cerrar', { duration: 4500 });
      },
    });
  }

  unassignGuest(guestId: string): void {
    this.floorPlanService.unassignGuest(guestId).subscribe({
      next: () => {
        this.snackBar.open('Invitado quitado de la mesa', 'Cerrar', { duration: 2000 });
        this.loadSeating();
      },
      error: (err) => {
        this.snackBar.open(err?.error?.error || 'Error al quitar asignación', 'Cerrar', { duration: 4000 });
      },
    });
  }

  onShapeChange(shape: TableShape): void {
    const table = this.selectedTable;
    if (!table) return;
    table.shape = shape;
    if (shape === 'round' || shape === 'square') {
      table.widthCm = 150;
      table.heightCm = 150;
    } else {
      table.widthCm = 220;
      table.heightCm = 120;
    }
  }

  tableTransform(table: VenueTable): string {
    return `translate(${table.xCm} ${table.yCm}) rotate(${table.rotationDeg})`;
  }

  viewBox(plan: FloorPlan): string {
    return `0 0 ${plan.widthCm} ${plan.heightCm}`;
  }

  isRound(table: VenueTable): boolean {
    return table.shape === 'round';
  }

  occupancy(table: VenueTable): TableOccupancy {
    return tableOccupancy(table);
  }

  tableSeatsLabel(table: VenueTable): string {
    const used = table.seatsUsed ?? 0;
    return `${used}/${table.seatCount}`;
  }

  tableFreeSeats(table: VenueTable): number {
    const used = table.seatsUsed ?? 0;
    return Math.max(0, table.seatCount - used);
  }

  categoryAssignHint(summary: CategorySummary): string | null {
    const table = this.selectedTable;
    if (!table) return null;
    const free = this.tableFreeSeats(table);
    if (free <= 0) return 'Mesa sin lugares libres';
    if (summary.seats > free) {
      return `Se asignan grupos hasta llenar la mesa (${free} lugares libres)`;
    }
    return null;
  }

  tableCanvasSummary(table: VenueTable): TableCanvasSummary | null {
    const assignments = table.assignments ?? [];
    if (assignments.length === 0) return null;

    const categoryLabels = [
      ...new Set(
        assignments.map((a) => normalizeGuestCategory(a.familyGroup) ?? 'Sin categoría'),
      ),
    ].sort();

    const seats =
      table.seatsUsed ?? assignments.reduce((sum, assignment) => sum + assignment.seatsUsed, 0);

    return {
      groups: assignments.length,
      seats,
      categoryLabels,
    };
  }

  formatTableCategories(summary: TableCanvasSummary): string {
    const text = summary.categoryLabels.join(', ');
    return text.length > 28 ? `${text.slice(0, 26)}…` : text;
  }

  labelFontSize(table: VenueTable, kind: 'number' | 'sub'): number {
    const base = Math.min(table.widthCm, table.heightCm);
    return kind === 'number' ? Math.max(16, base * 0.18) : Math.max(10, base * 0.1);
  }

  tableLabelStackOffset(table: VenueTable): number {
    return this.labelFontSize(table, 'sub') * 1.1;
  }

  private handleLoadError(err: { error?: { error?: string } }): void {
    this.loading = false;
    this.snackBar.open(err?.error?.error || 'No se pudo cargar el plano del salón', 'Cerrar', { duration: 5000 });
  }

  private clientToSvg(svg: SVGSVGElement, clientX: number, clientY: number) {
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const matrix = svg.getScreenCTM();
    if (!matrix) return { x: 0, y: 0 };
    const transformed = pt.matrixTransform(matrix.inverse());
    return { x: transformed.x, y: transformed.y };
  }
}
