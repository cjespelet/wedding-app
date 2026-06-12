import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import type { CreateGuestPayload, UpdateGuestPayload } from '../../core/services/guests.service';

export interface GuestDialogData {
  fullName?: string;
  email?: string;
  familyGroup?: string;
  adultsCount?: number;
  minorsCount?: number;
  username?: string;
  accessCode?: string;
}

@Component({
  standalone: true,
  selector: 'app-guest-dialog',
  templateUrl: './guest-dialog.component.html',
  styleUrls: ['./guest-dialog.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
})
export class GuestDialogComponent {
  form!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<GuestDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: GuestDialogData | null,
  ) {
    const d = this.data;
    this.form = this.fb.group({
      fullName: [d?.fullName ?? '', Validators.required],
      email: [d?.email ?? ''],
      familyGroup: [d?.familyGroup ?? ''],
      adultsCount: [d?.adultsCount ?? 1, [Validators.required, Validators.min(0)]],
      minorsCount: [d?.minorsCount ?? 0, [Validators.required, Validators.min(0)]],
      username: [d?.username ?? ''],
      accessCode: [d?.accessCode ?? '', [Validators.maxLength(4), Validators.pattern(/^\d*$/)]],
    });
  }

  save(): void {
    if (this.form.invalid) return;
    const v = this.form.value;
    const payload: CreateGuestPayload & UpdateGuestPayload = {
      fullName: v.fullName ?? '',
      email: v.email || undefined,
      familyGroup: v.familyGroup || undefined,
      adultsCount: v.adultsCount ?? 1,
      minorsCount: v.minorsCount ?? 0,
      username: v.username?.trim() || undefined,
      accessCode: v.accessCode?.replace(/\D/g, '').slice(0, 4) || undefined,
    };
    this.dialogRef.close(payload);
  }
}
