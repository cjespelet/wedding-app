import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { PhotosService, Photo } from '../../core/services/photos.service';
import { WeddingService } from '../../core/services/wedding.service';
import { PhotoPreviewDialogComponent } from './photo-preview-dialog.component';
import { downloadSalonQrPdf } from './qr-salon-pdf';

@Component({
  standalone: true,
  selector: 'app-photo-gallery-manager',
  templateUrl: './photo-gallery-manager.page.html',
  styleUrls: ['./photo-gallery-manager.page.scss'],
  imports: [CommonModule, MatCardModule, MatButtonModule, MatGridListModule, MatProgressSpinnerModule, MatSnackBarModule, MatDialogModule],
})
export class PhotoGalleryManagerPage implements OnInit {
  private readonly photosService = inject(PhotosService);
  private readonly weddingService = inject(WeddingService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly cdRef = inject(ChangeDetectorRef);

  photos: Photo[] = [];
  loading = false;

  qrUploadUrl = '';
  qrLoading = false;
  qrRegenerating = false;
  qrPdfDownloading = false;
  allowQrUpload = true;
  coupleTitle = 'Jesica & Javier';

  ngOnInit(): void {
    this.load();
    this.loadQrUpload();
  }

  get qrImageUrl(): string {
    if (!this.qrUploadUrl) {
      return '';
    }
    return `https://api.qrserver.com/v1/create-qr-code/?size=280x280&margin=10&data=${encodeURIComponent(this.qrUploadUrl)}`;
  }

  loadQrUpload(): void {
    this.qrLoading = true;
    this.weddingService.getWedding().subscribe({
      next: (wedding) => {
        this.qrLoading = false;
        if (!wedding) {
          return;
        }
        this.allowQrUpload = wedding.allowQrUpload ?? true;
        this.coupleTitle = `${wedding.brideName} & ${wedding.groomName}`;
        this.qrUploadUrl = this.weddingService.buildQrUploadUrl(wedding.qrUploadToken);
        this.cdRef.detectChanges();
      },
      error: () => {
        this.qrLoading = false;
      },
    });
  }

  generateQrUploadLink(): void {
    this.qrRegenerating = true;
    this.weddingService.regenerateQrUploadToken().subscribe({
      next: (res) => {
        this.qrRegenerating = false;
        this.allowQrUpload = res.allowQrUpload;
        this.qrUploadUrl = this.weddingService.buildQrUploadUrl(res.qrUploadToken);
        this.snackBar.open('QR listo para escanear', 'OK', { duration: 2500 });
        this.cdRef.detectChanges();
      },
      error: () => {
        this.qrRegenerating = false;
        this.snackBar.open('No se pudo generar el QR', 'Cerrar', { duration: 3000 });
      },
    });
  }

  copyQrUploadUrl(): void {
    if (!this.qrUploadUrl) {
      return;
    }
    navigator.clipboard.writeText(this.qrUploadUrl).then(() => {
      this.snackBar.open('Link copiado', 'OK', { duration: 2500 });
    });
  }

  async downloadQrPdf(): Promise<void> {
    if (!this.qrImageUrl || !this.qrUploadUrl) {
      return;
    }

    this.qrPdfDownloading = true;
    this.cdRef.detectChanges();

    try {
      const safeName = this.coupleTitle
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      await downloadSalonQrPdf({
        coupleTitle: this.coupleTitle,
        qrImageUrl: `https://api.qrserver.com/v1/create-qr-code/?size=500x500&margin=10&data=${encodeURIComponent(this.qrUploadUrl)}`,
        fileName: `qr-fotos-salon-${safeName || 'boda'}.pdf`,
      });
      this.snackBar.open('PDF descargado', 'OK', { duration: 2500 });
    } catch {
      this.snackBar.open('No se pudo generar el PDF', 'Cerrar', { duration: 3000 });
    } finally {
      this.qrPdfDownloading = false;
      this.cdRef.detectChanges();
    }
  }

  load() {
    this.loading = true;

    this.photosService.listAdminPhotos().subscribe({
      next: (list) => {
        console.log(list);
        this.photos = list
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          );
        this.loading = false;
        this.cdRef.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.snackBar.open('Error al cargar fotos', 'Cerrar', { duration: 3000 });
      },
    });
  }

  onUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const formData = new FormData();
    Array.from(input.files).forEach((file) => formData.append('photos', file));

    this.loading = true;
    this.photosService.uploadFormData(formData).subscribe(
      () => {
        this.snackBar.open('Fotos subidas', 'Cerrar', { duration: 3000 });
        this.load();
      },
      () => {
        this.loading = false;
        this.snackBar.open('Error al subir fotos', 'Cerrar', { duration: 3000 });
      },
    );
  }

  approve(photo: Photo) {
    this.photosService.approve(photo.id).subscribe(() => this.load());
  }

  toggleHighlight(photo: Photo) {
    this.photosService.toggleHighlight(photo.id, !photo.highlighted).subscribe(() => this.load());
  }

  remove(photo: Photo) {
    if (!confirm('¿Eliminar esta foto?')) return;
    this.photos = this.photos.filter((p) => p.id !== photo.id);
    this.cdRef.detectChanges();

    this.photosService.remove(photo.id).subscribe(() => this.load());
  }

  openPreview(photo: Photo) {
    this.dialog.open(PhotoPreviewDialogComponent, {
      maxWidth: '90vw',
      data: photo,
    });
  }
}
