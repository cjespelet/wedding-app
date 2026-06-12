import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import type { Photo } from '../../core/services/photos.service';

@Component({
  standalone: true,
  selector: 'app-photo-preview-dialog',
  templateUrl: './photo-preview-dialog.component.html',
  styleUrls: ['./photo-preview-dialog.component.scss'],
  imports: [CommonModule, MatDialogModule, MatButtonModule],
})
export class PhotoPreviewDialogComponent {
  constructor(
    private dialogRef: MatDialogRef<PhotoPreviewDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Photo,
  ) {}

  close(): void {
    this.dialogRef.close();
  }

  print(): void {
    const win = window.open(this.data.largeUrl || this.data.squareUrl, '_blank');
    if (win) {
      win.onload = () => win.print();
    }
  }

  download(): void {
    const link = document.createElement('a');
    link.href = this.data.largeUrl || this.data.squareUrl;
    link.download = 'foto.jpg';
    link.click();
  }
}

