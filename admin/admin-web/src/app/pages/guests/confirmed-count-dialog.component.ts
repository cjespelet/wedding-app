import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import type { UpdateRsvpPayload } from '../../core/services/guests.service';

export interface ConfirmedCountDialogData {
  fullName: string;
  adultsCount: number;
  minorsCount: number;
  confirmedAdults: number;
  confirmedMinors: number;
}

@Component({
  standalone: true,
  selector: 'app-confirmed-count-dialog',
  templateUrl: './confirmed-count-dialog.component.html',
  styleUrls: ['./confirmed-count-dialog.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
})
export class ConfirmedCountDialogComponent {
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ConfirmedCountDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmedCountDialogData,
  ) {
    this.form = this.fb.group({
      confirmedAdults: [data.confirmedAdults, [Validators.required, Validators.min(0)]],
      confirmedMinors: [data.confirmedMinors, [Validators.required, Validators.min(0)]],
    });
  }

  get total(): number {
    const v = this.form.value;
    return (v.confirmedAdults ?? 0) + (v.confirmedMinors ?? 0);
  }

  save(): void {
    if (this.form.invalid || this.total < 1) return;
    const v = this.form.value;
    const payload: UpdateRsvpPayload = {
      confirmedAdults: v.confirmedAdults ?? 0,
      confirmedMinors: v.confirmedMinors ?? 0,
    };
    this.dialogRef.close(payload);
  }
}
