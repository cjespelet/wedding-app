import { Component, OnInit, AfterViewInit, ViewChild, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { GuestsService, Guest, CreateGuestPayload, UpdateGuestPayload } from '../../core/services/guests.service';
import { GuestDialogComponent } from './guest-dialog.component';
import { CheckinDialogComponent } from './checkin-dialog.component';
import { environment } from '../../../environments/environment';

@Component({
  standalone: true,
  selector: 'app-guest-list',
  templateUrl: './guest-list.page.html',
  styleUrls: ['./guest-list.page.scss'],
  imports: [CommonModule, MatTableModule, MatPaginatorModule, MatButtonModule, MatDialogModule, MatSnackBarModule],
})
export class GuestListPage implements OnInit, AfterViewInit {
  private readonly guestsService = inject(GuestsService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly cdr = inject(ChangeDetectorRef);

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  displayedColumns = [
    'fullName',
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

  get totalAdults(): number {
    return this.dataSource.data.reduce((sum, g) => sum + (g.adultsCount ?? 0), 0);
  }
  get totalMinors(): number {
    return this.dataSource.data.reduce((sum, g) => sum + (g.minorsCount ?? 0), 0);
  }
  get totalGuests(): number {
    return this.totalAdults + this.totalMinors;
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
        this.dataSource.data = guests ?? [];
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
      },
    });
    ref.afterClosed().subscribe((result: UpdateGuestPayload | undefined) => {
      if (result) {
        this.guestsService.update(guest.id, result).subscribe({
          next: () => {
            this.snackBar.open('Invitado actualizado', 'Cerrar', { duration: 3000 });
            this.load();
          },
          error: () => this.snackBar.open('Error al actualizar invitado', 'Cerrar', { duration: 3000 }),
        });
      }
    });
  }

  deleteGuest(guest: Guest) {
    if (!confirm(`¿Eliminar a ${guest.fullName}?`)) return;
    this.guestsService.remove(guest.id).subscribe({
      next: () => {
        this.snackBar.open('Invitado eliminado', 'Cerrar', { duration: 3000 });
        this.load();
      },
      error: () => this.snackBar.open('Error al eliminar invitado', 'Cerrar', { duration: 3000 }),
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
}

