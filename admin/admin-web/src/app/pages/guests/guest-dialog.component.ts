import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import type { CreateGuestPayload, GuestDialogResult } from '../../core/services/guests.service';
import { GUEST_CATEGORIES } from '../../core/guest-categories';

export interface GuestDialogData {
  fullName?: string;
  email?: string;
  familyGroup?: string;
  adultsCount?: number;
  minorsCount?: number;
  username?: string;
  accessCode?: string;
  hasConfirmedRsvp?: boolean;
  confirmedAdults?: number;
  confirmedMinors?: number;
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
    MatSelectModule,
  ],
})
export class GuestDialogComponent {
  form!: FormGroup;
  readonly categories = GUEST_CATEGORIES;
  readonly hasConfirmedRsvp: boolean;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<GuestDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: GuestDialogData | null,
  ) {
    const d = this.data;
    this.hasConfirmedRsvp = !!d?.hasConfirmedRsvp;
    this.form = this.fb.group({
      fullName: [d?.fullName ?? '', Validators.required],
      email: [d?.email ?? ''],
      familyGroup: [d?.familyGroup ?? ''],
      adultsCount: [d?.adultsCount ?? 1, [Validators.required, Validators.min(0)]],
      minorsCount: [d?.minorsCount ?? 0, [Validators.required, Validators.min(0)]],
      username: [d?.username ?? ''],
      accessCode: [d?.accessCode ?? '', [Validators.maxLength(4), Validators.pattern(/^\d*$/)]],
      confirmedAdults: [d?.confirmedAdults ?? 0, [Validators.required, Validators.min(0)]],
      confirmedMinors: [d?.confirmedMinors ?? 0, [Validators.required, Validators.min(0)]],
    });
  }

  save(): void {
    if (this.form.invalid) return;
    const v = this.form.value;
    const payload: CreateGuestPayload & GuestDialogResult = {
      fullName: v.fullName ?? '',
      email: v.email || undefined,
      familyGroup: v.familyGroup ? v.familyGroup : null,
      adultsCount: v.adultsCount ?? 1,
      minorsCount: v.minorsCount ?? 0,
      username: v.username?.trim() || undefined,
      accessCode: v.accessCode?.replace(/\D/g, '').slice(0, 4) || undefined,
    };
    if (this.hasConfirmedRsvp) {
      payload.confirmedAdults = v.confirmedAdults ?? 0;
      payload.confirmedMinors = v.confirmedMinors ?? 0;
    }
    this.dialogRef.close(payload);
  }
}
