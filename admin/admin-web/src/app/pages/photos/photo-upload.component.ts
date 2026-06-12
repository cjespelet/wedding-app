import { Component, EventEmitter, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PhotosService } from '../../core/services/photos.service';

@Component({
  standalone: true,
  selector: 'app-photo-upload',
  template: `
    <div class="upload-container">
      <button
        type="button"
        class="btn btn-primary"
        (click)="fileInput.click()"
        [disabled]="uploading"
      >
        Subir foto
      </button>
      <input
        #fileInput
        type="file"
        accept="image/*"
        (change)="onFileSelected($event)"
        hidden
      />

      <div class="preview" *ngIf="previewUrl">
        <img [src]="previewUrl" alt="Preview" />
      </div>

      <div class="actions" *ngIf="previewUrl">
        <button
          type="button"
          class="btn btn-secondary"
          (click)="clear()"
          [disabled]="uploading"
        >
          Cancelar
        </button>
        <button
          type="button"
          class="btn btn-primary"
          (click)="upload()"
          [disabled]="uploading"
        >
          Confirmar subida
        </button>
        <mat-progress-spinner
          *ngIf="uploading"
          diameter="24"
          mode="indeterminate"
        ></mat-progress-spinner>
      </div>
    </div>
  `,
  styleUrls: ['./photo-upload.component.scss'],
  imports: [CommonModule, MatButtonModule, MatProgressSpinnerModule],
})
export class PhotoUploadComponent {
  private readonly photosService = inject(PhotosService);

  @Output() uploaded = new EventEmitter<void>();

  previewUrl: string | null = null;
  private processedFile: File | null = null;
  uploading = false;

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    const processed = await this.resizeToSquare(file, 800, 0.8);
    this.processedFile = processed;
    this.previewUrl = URL.createObjectURL(processed);
  }

  clear(): void {
    if (this.previewUrl) {
      URL.revokeObjectURL(this.previewUrl);
    }
    this.previewUrl = null;
    this.processedFile = null;
  }

  upload(): void {
    if (!this.processedFile || this.uploading) return;
    this.uploading = true;
    const formData = new FormData();
    formData.append('photos', this.processedFile);
    this.photosService.uploadFormData(formData).subscribe({
      next: () => {
        this.uploading = false;
        this.clear();
        this.uploaded.emit();
      },
      error: () => {
        this.uploading = false;
      },
    });
  }

  private resizeToSquare(file: File, size: number, quality: number): Promise<File> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('No se pudo obtener el contexto del canvas'));
          return;
        }

        const scale = Math.max(size / img.width, size / img.height);
        const x = (size - img.width * scale) / 2;
        const y = (size - img.height * scale) / 2;

        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, size, size);
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('No se pudo crear el blob de la imagen'));
              return;
            }
            const ext = 'jpg';
            const processedFile = new File([blob], this.ensureExtension(file.name, ext), {
              type: 'image/jpeg',
            });
            resolve(processedFile);
          },
          'image/jpeg',
          quality,
        );
      };
      img.onerror = (err) => reject(err);
      img.src = URL.createObjectURL(file);
    });
  }

  private ensureExtension(name: string, ext: string): string {
    const dot = name.lastIndexOf('.');
    if (dot === -1) return `${name}.${ext}`;
    return `${name.substring(0, dot)}.${ext}`;
  }
}

