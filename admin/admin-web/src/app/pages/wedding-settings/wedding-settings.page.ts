import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { WeddingService } from '../../core/services/wedding.service';

@Component({
  standalone: true,
  selector: 'app-wedding-settings',
  templateUrl: './wedding-settings.page.html',
  styleUrls: ['./wedding-settings.page.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSnackBarModule,
  ],
})
export class WeddingSettingsPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly weddingService = inject(WeddingService);
  private readonly cdRef = inject(ChangeDetectorRef);

  loading = false;
  saveSuccess = '';
  saveError = '';

  form = this.fb.group({
    brideName: ['', Validators.required],
    groomName: ['', Validators.required],
    date: [''],
    time: [''],
    location: [''],
    instructions: [''],
    description: [''],
    allowPhotoSharing: [true],
    maxSharesPerGuest: [5],
  });

  ngOnInit(): void {
    this.loading = true;
    this.weddingService.getWedding().subscribe({
      next: (w) => {
        if (w) {
          this.form.patchValue({
            brideName: w.brideName,
            groomName: w.groomName,
            date: w.date?.substring(0, 10),
            time: w.time,
            location: w.location,
            instructions: w.instructions,
            description: w.description,
            allowPhotoSharing: w.allowPhotoSharing,
            maxSharesPerGuest: w.maxSharesPerGuest,
          });
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  save() {
    if (this.form.invalid) return;
    this.loading = true;
    this.saveSuccess = '';
    this.saveError = '';
    const value = this.form.value;
    this.weddingService
      .updateWedding({
        brideName: value.brideName ?? undefined,
        groomName: value.groomName ?? undefined,
        date: value.date ?? undefined,
        time: value.time ?? undefined,
        location: value.location ?? undefined,
        instructions: value.instructions ?? undefined,
        description: value.description ?? undefined,
        allowPhotoSharing: value.allowPhotoSharing ?? undefined,
        maxSharesPerGuest: value.maxSharesPerGuest ?? undefined,
      })
      .subscribe({
        next: () => {
          console.log('Wedding settings saved');
          this.loading = false;
          this.saveSuccess = 'Configuración guardada correctamente.';
          this.cdRef.detectChanges();
        },
        error: (err) => {
          console.error('Error saving wedding settings', err);
          this.loading = false;
          this.saveError = 'Ocurrió un error al guardar la configuración.';
          this.cdRef.detectChanges();
        },
      });
  }

  clearAlerts() {
    this.saveSuccess = '';
    this.saveError = '';
  }
}

