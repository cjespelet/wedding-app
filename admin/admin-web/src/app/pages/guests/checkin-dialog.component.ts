import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  standalone: true,
  selector: 'app-checkin-dialog',
  templateUrl: './checkin-dialog.component.html',
  styleUrls: ['./checkin-dialog.component.scss'],
  imports: [CommonModule, MatDialogModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule],
})
export class CheckinDialogComponent {
  form;

  constructor(private fb: FormBuilder, private dialogRef: MatDialogRef<CheckinDialogComponent>) {
    this.form = this.fb.group({
      qr_code: ['', Validators.required],
    });
  }

  submit() {
    if (this.form.invalid) return;
    this.dialogRef.close(this.form.value.qr_code);
  }
}

