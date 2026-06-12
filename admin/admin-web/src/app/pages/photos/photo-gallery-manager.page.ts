import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { PhotosService, Photo } from '../../core/services/photos.service';
import { PhotoPreviewDialogComponent } from './photo-preview-dialog.component';

@Component({
  standalone: true,
  selector: 'app-photo-gallery-manager',
  templateUrl: './photo-gallery-manager.page.html',
  styleUrls: ['./photo-gallery-manager.page.scss'],
  imports: [CommonModule, MatCardModule, MatButtonModule, MatGridListModule, MatProgressSpinnerModule, MatSnackBarModule, MatDialogModule],
})
export class PhotoGalleryManagerPage implements OnInit {
  private readonly photosService = inject(PhotosService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly cdRef = inject(ChangeDetectorRef);

  photos: Photo[] = [];
  loading = false;

  ngOnInit(): void {
    this.load();
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
    // Actualiza la UI inmediatamente
    this.photos = this.photos.filter((p) => p.id !== photo.id);
    this.cdRef.detectChanges();

    // Sincroniza con el backend y recarga por si cambió algo más
    this.photosService.remove(photo.id).subscribe(() => this.load());
  }

  openPreview(photo: Photo) {
    this.dialog.open(PhotoPreviewDialogComponent, {
      maxWidth: '90vw',
      data: photo,
    });
  }

}

