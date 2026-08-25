import { Component, OnInit, AfterViewInit, ViewChild, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { GuestsService, Guest, CreateGuestPayload, GuestDialogResult, lastRsvp, confirmedCounts } from '../../core/services/guests.service';
import { GuestDialogComponent } from './guest-dialog.component';
import { CheckinDialogComponent } from './checkin-dialog.component';
import { environment } from '../../../environments/environment';
import { GUEST_CATEGORIES } from '../../core/guest-categories';
import { switchMap } from 'rxjs/operators';
import { of } from 'rxjs';

type GuestFilter = 'all' | 'confirmed' | 'not_confirmed' | 'present';
type CategoryFilter = 'all' | 'uncategorized' | (typeof GUEST_CATEGORIES)[number];

@Component({
  standalone: true,
  selector: 'app-guest-list',
  templateUrl: './guest-list.page.html',
  styleUrls: ['./guest-list.page.scss'],
  imports: [CommonModule, FormsModule, MatTableModule, MatPaginatorModule, MatButtonModule, MatDialogModule, MatSnackBarModule],
})
export class GuestListPage implements OnInit, AfterViewInit {
  private readonly guestsService = inject(GuestsService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly cdr = inject(ChangeDetectorRef);

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  displayedColumns = [
    'nameGuest',
    'fullName',
    'familyGroup',
    'adultsCount',
    'minorsCount',
    'username',
    'accessCode',
    'confirmaPresencia',
    'cantidadConfirma',
    'checkedIn',
    'canSharePhotos',
    'photoSharesCount',
    'actions',
  ];
  dataSource = new MatTableDataSource<Guest>([]);
  guestFilter: GuestFilter = 'all';
  categoryFilter: CategoryFilter = 'all';
  searchQuery = '';
  readonly categories = GUEST_CATEGORIES;
  private allGuests: Guest[] = [];

  get totalAdults(): number {
    return this.dataSource.data.reduce((sum, g) => sum + this.adultsForTotals(g), 0);
  }
  get totalMinors(): number {
    return this.dataSource.data.reduce((sum, g) => sum + this.minorsForTotals(g), 0);
  }
  get totalGuests(): number {
    return this.totalAdults + this.totalMinors;
  }

  private adultsForTotals(guest: Guest): number {
    if (this.guestFilter === 'confirmed') {
      return confirmedCounts(guest)?.adults ?? 0;
    }
    return guest.adultsCount ?? 0;
  }

  private minorsForTotals(guest: Guest): number {
    if (this.guestFilter === 'confirmed') {
      return confirmedCounts(guest)?.minors ?? 0;
    }
    return guest.minorsCount ?? 0;
  }

  ngOnInit(): void {
    this.load();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
  }

  load() {
    this.guestsService.list().subscribe({
      next: (guests) => {
        this.allGuests = guests ?? [];
        this.applyFilter();
        setTimeout(() => {
          this.dataSource.paginator = this.paginator;
          this.cdr.detectChanges();
        }, 0);
      },
      error: (err) => {
        this.snackBar.open('Error al cargar invitados: ' + (err?.error?.error || err?.message || 'Revisa la consola'), 'Cerrar', { duration: 5000 });
      },
    });
  }

  setGuestFilter(filter: GuestFilter): void {
    this.guestFilter = filter;
    this.applyFilter();
    this.cdr.detectChanges();
  }

  setCategoryFilter(filter: CategoryFilter): void {
    this.categoryFilter = filter;
    this.applyFilter();
    this.cdr.detectChanges();
  }

  onCategoryFilterChange(event: Event): void {
    this.setCategoryFilter((event.target as HTMLSelectElement).value as CategoryFilter);
  }

  onSearchChange(event: Event): void {
    this.searchQuery = (event.target as HTMLInputElement).value;
    this.applyFilter();
    this.cdr.detectChanges();
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.applyFilter();
    this.cdr.detectChanges();
  }

  private applyFilter(): void {
    let filtered = this.allGuests;
    switch (this.guestFilter) {
      case 'confirmed':
        filtered = this.allGuests.filter((g) => this.isConfirmed(g));
        break;
      case 'not_confirmed':
        filtered = this.allGuests.filter((g) => !this.isConfirmed(g));
        break;
      case 'present':
        filtered = this.allGuests.filter((g) => g.checkedIn);
        break;
    }

    if (this.categoryFilter === 'uncategorized') {
      filtered = filtered.filter((g) => !g.familyGroup);
    } else if (this.categoryFilter !== 'all') {
      filtered = filtered.filter((g) => g.familyGroup === this.categoryFilter);
    }

    const query = this.searchQuery.trim().toLowerCase();
    if (query) {
      filtered = filtered.filter((g) => this.matchesSearch(g, query));
    }

    this.dataSource.data = filtered;
    this.paginator?.firstPage();
  }

  private matchesSearch(guest: Guest, query: string): boolean {
    const haystack = [guest.fullName, guest.nameGuest, guest.username, guest.familyGroup]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return haystack.includes(query);
  }

  private isConfirmed(guest: Guest): boolean {
    return !!lastRsvp(guest)?.attending;
  }

  confirmedSummary(guest: Guest): string {
    const counts = confirmedCounts(guest);
    if (!counts) return '—';
    if (counts.minors > 0) {
      return `${counts.total} (${counts.adults}+${counts.minors})`;
    }
    return String(counts.total);
  }

  inviteLink(guest: Guest): string {
    const base = environment.invitationBaseUrl.replace(/\/?$/, '/');
    return `${base}?invite=${encodeURIComponent(guest.id)}`;
  }

  copyInviteLink(guest: Guest): void {
    const link = this.inviteLink(guest);
    navigator.clipboard.writeText(link).then(
      () => this.snackBar.open('Link de invitación copiado', 'Cerrar', { duration: 2500 }),
      () => this.snackBar.open('No se pudo copiar el link', 'Cerrar', { duration: 3000 }),
    );
  }

  resetRegistration(guest: Guest): void {
    if (!guest.username) return;
    const label = guest.nameGuest || guest.fullName;
    if (
      !confirm(
        `¿Resetear la cuenta de "${label}"?\n\nSe borrará la confirmación (RSVP) y el check-in. Podrá volver a registrarse y confirmar con el link de invitación. Las fotos se mantienen.`,
      )
    ) {
      return;
    }
    this.guestsService.resetRegistration(guest.id).subscribe({
      next: () => {
        this.snackBar.open('Registro reseteado — podés reenviar el link', 'Cerrar', { duration: 3500 });
        this.load();
      },
      error: (err) =>
        this.snackBar.open(err?.error?.error || 'Error al resetear registro', 'Cerrar', { duration: 4000 }),
    });
  }

  addGuest() {
    const ref = this.dialog.open(GuestDialogComponent, {
      width: '400px',
      data: null,
    });
    ref.afterClosed().subscribe((result) => {
      if (result) {
        this.guestsService.create(result).subscribe({
          next: () => {
            this.snackBar.open('Invitado creado', 'Cerrar', { duration: 3000 });
            this.load();
          },
          error: () => this.snackBar.open('Error al crear invitado', 'Cerrar', { duration: 3000 }),
        });
      }
    });
  }

  editGuest(guest: Guest) {
    const rsvp = lastRsvp(guest);
    const counts = confirmedCounts(guest);
    const ref = this.dialog.open(GuestDialogComponent, {
      width: '480px',
      data: {
        fullName: guest.fullName,
        email: guest.email,
        familyGroup: guest.familyGroup,
        adultsCount: guest.adultsCount,
        minorsCount: guest.minorsCount,
        username: guest.username,
        accessCode: guest.accessCode,
        hasConfirmedRsvp: !!rsvp?.attending,
        confirmedAdults: counts?.adults ?? guest.adultsCount,
        confirmedMinors: counts?.minors ?? guest.minorsCount,
      },
    });
    ref.afterClosed().subscribe((result: GuestDialogResult | undefined) => {
      if (!result) return;
      const { confirmedAdults, confirmedMinors, ...guestPayload } = result;
      this.guestsService
        .update(guest.id, guestPayload)
        .pipe(
          switchMap(() =>
            confirmedAdults != null && confirmedMinors != null
              ? this.guestsService.updateRsvp(guest.id, { confirmedAdults, confirmedMinors })
              : of(null),
          ),
        )
        .subscribe({
          next: () => {
            this.snackBar.open('Invitado actualizado', 'Cerrar', { duration: 3000 });
            this.load();
          },
          error: (err) =>
            this.snackBar.open(err?.error?.error || 'Error al actualizar invitado', 'Cerrar', { duration: 4000 }),
        });
    });
  }

  deleteGuest(guest: Guest) {
    const rsvp = lastRsvp(guest);
    const extra =
      rsvp || guest.username
        ? '\n\nSe borrarán también su confirmación y cuenta (si tenía). Podés crear otro invitado con los mismos cupos.'
        : '';
    if (!confirm(`¿Eliminar a ${guest.fullName}?${extra}`)) return;
    this.guestsService.remove(guest.id).subscribe({
      next: () => {
        this.snackBar.open('Invitado eliminado', 'Cerrar', { duration: 3000 });
        this.load();
      },
      error: (err) =>
        this.snackBar.open(err?.error?.error || 'Error al eliminar invitado', 'Cerrar', { duration: 4000 }),
    });
  }

  openCheckinDialog() {
    const ref = this.dialog.open(CheckinDialogComponent, {
      width: '400px',
    });
    ref.afterClosed().subscribe((qr) => {
      if (qr) {
        this.guestsService.checkinByQr(qr).subscribe({
          next: () => {
            this.snackBar.open('Check-in registrado', 'Cerrar', { duration: 3000 });
            this.load();
          },
          error: () => this.snackBar.open('QR no válido', 'Cerrar', { duration: 3000 }),
        });
      }
    });
  }

  toggleCanSharePhotos(guest: Guest, checked: boolean) {
    this.guestsService.update(guest.id, { canSharePhotos: checked }).subscribe({
      next: () => this.load(),
      error: () =>
        this.snackBar.open('Error al actualizar permisos de compartir fotos', 'Cerrar', {
          duration: 3000,
        }),
    });
  }

  updateCategory(guest: Guest, value: string): void {
    const familyGroup = value || null;
    if ((guest.familyGroup || null) === familyGroup) return;

    this.guestsService.update(guest.id, { familyGroup }).subscribe({
      next: (updated) => {
        guest.familyGroup = updated.familyGroup ?? undefined;
        this.snackBar.open('Categoría actualizada', 'Cerrar', { duration: 2000 });
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.snackBar.open(
          err?.error?.error || 'Error al actualizar categoría',
          'Cerrar',
          { duration: 4000 },
        );
        this.load();
      },
    });
  }
}

