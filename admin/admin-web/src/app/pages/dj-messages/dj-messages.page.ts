import { ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DjMessagesService, DjRequest } from '../../core/services/dj-messages.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  standalone: true,
  selector: 'app-dj-messages',
  templateUrl: './dj-messages.page.html',
  styleUrls: ['./dj-messages.page.scss'],
  imports: [CommonModule, MatSnackBarModule, ReactiveFormsModule],
})
export class DjMessagesPage implements OnInit, OnDestroy {
  private readonly service = inject(DjMessagesService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly fb = inject(FormBuilder);
  private readonly cdRef = inject(ChangeDetectorRef);
  private readonly auth = inject(AuthService);

  displayedColumns = ['guest', 'song', 'comment'];
  data: DjRequest[] = [];
  currentRole = this.auth.getCurrentUser()?.role ?? '';

  form = this.fb.group({
    title: ['', Validators.required],
    artist: [''],
    comment: [''],
  });

  private readonly refreshIntervalMs = 2 * 60 * 1000;
  private refreshTimer: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    this.load();
    this.startAutoRefresh();
  }

  ngOnDestroy(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  get canCreateRequests(): boolean {
    return this.currentRole === 'super_admin' || this.currentRole === 'wedding_admin';
  }

  get canManageStatus(): boolean {
    return this.currentRole === 'dj' || this.currentRole === 'super_admin' || this.currentRole === 'wedding_admin';
  }

  load() {
    this.service.list().subscribe({
      next: (list) => {
        console.log('DJ requests loaded', list);
        this.data = list;
        this.cdRef.detectChanges();
      },
      error: (err) => {
        console.error('Error loading DJ requests', err);
        this.snackBar.open('Error al cargar pedidos al DJ', 'Cerrar', { duration: 3000 });
      },
    });
  }

  private startAutoRefresh() {
    if (this.refreshTimer) return;
    this.refreshTimer = setInterval(() => {
      this.load();
    }, this.refreshIntervalMs);
  }

  submit() {
    if (!this.canCreateRequests) return;
    if (this.form.invalid) return;
    this.service.createAdminRequest(this.form.value as any).subscribe({
      next: (created) => {
        this.snackBar.open('Pedido enviado al DJ', 'Cerrar', { duration: 3000 });
        // Insertamos al principio para que se vea inmediatamente
        this.data = [created as DjRequest, ...this.data];
        this.form.reset({ title: '', artist: '', comment: '' });
      },
      error: () => this.snackBar.open('Error al enviar pedido', 'Cerrar', { duration: 3000 }),
    });
  }

  markAsPlayed(row: DjRequest) {
    if (!this.canManageStatus || row.played) return;

    this.service.markPlayed(row.id).subscribe({
      next: () => {
        this.snackBar.open('Marcado como reproducido', 'Cerrar', { duration: 2500 });
        this.load();
      },
      error: () => this.snackBar.open('No se pudo actualizar el estado', 'Cerrar', { duration: 3000 }),
    });
  }
}

