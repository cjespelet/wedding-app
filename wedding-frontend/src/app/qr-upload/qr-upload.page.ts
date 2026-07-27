import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { IonicModule } from '@ionic/angular';

import { QrUploadService } from '../services/qr-upload.service';

@Component({
  standalone: true,
  selector: 'app-qr-upload',
  templateUrl: './qr-upload.page.html',
  styleUrls: ['./qr-upload.page.scss'],
  imports: [CommonModule, IonicModule],
})
export class QrUploadPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly qrUploadService = inject(QrUploadService);

  token: string | null = null;
  loading = true;
  invalidLink = false;
  brideName = '';
  groomName = '';
  uploaderLabel = 'Salón QR';

  uploading = false;
  uploadError: string | null = null;
  uploadSuccess = false;
  uploadedCount = 0;

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('w');
    if (!this.token) {
      this.loading = false;
      this.invalidLink = true;
      return;
    }

    this.qrUploadService.checkStatus(this.token).subscribe({
      next: (status) => {
        this.brideName = status.brideName;
        this.groomName = status.groomName;
        this.uploaderLabel = status.uploaderLabel;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.invalidLink = true;
      },
    });
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files ? Array.from(input.files) : [];
    input.value = '';
    if (!files.length || !this.token || this.uploading) {
      return;
    }
    this.upload(files);
  }

  private upload(files: File[]): void {
    if (!this.token) {
      return;
    }

    this.uploading = true;
    this.uploadError = null;
    this.uploadSuccess = false;

    this.qrUploadService.uploadPhotos(this.token, files).subscribe({
      next: (res) => {
        this.uploading = false;
        this.uploadSuccess = true;
        this.uploadedCount = res.uploaded;
      },
      error: (err) => {
        this.uploading = false;
        const msg = err?.error?.error;
        this.uploadError =
          typeof msg === 'string' ? msg : 'No pudimos subir las fotos. Probá de nuevo.';
      },
    });
  }

  resetSuccess(): void {
    this.uploadSuccess = false;
    this.uploadedCount = 0;
  }
}
