import { Component, OnInit, inject, signal } from '@angular/core';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonGrid,
  IonRow,
  IonCol,
  IonImg,
  IonButton,
} from '@ionic/angular/standalone';
import { NgFor, NgIf } from '@angular/common';
import { GalleryService, Photo } from '../../../core/services/gallery.service';
import { AdminService } from '../../../core/services/admin.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Component({
  standalone: true,
  selector: 'app-admin-photos',
  templateUrl: './admin-photos.page.html',
  styleUrls: ['./admin-photos.page.scss'],
  imports: [
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonGrid,
    IonRow,
    IonCol,
    IonImg,
    IonButton,
    NgFor,
    NgIf,
  ],
})
export class AdminPhotosPage implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly galleryService = inject(GalleryService);
  private readonly adminService = inject(AdminService);

  readonly photos = signal<Photo[]>([]);
  readonly filter = signal<'all' | 'pending' | 'highlighted'>('all');

  private weddingId: string | null = null;

  ngOnInit(): void {
    // WeddingId podría venir del token o de otra llamada; para simplificar,
    // asumimos que hay al menos una foto o se configurará más adelante.
    // Aquí podrías llamar a un endpoint de "mi boda" para recuperar weddingId.
    this.load();
  }

  load() {
    if (!this.weddingId) {
      // fallback: no tenemos weddingId, no usamos GalleryService.getWeddingPhotos,
      // sino el endpoint de admin que ya filtra por la boda del admin.
      this.http.get<Photo[]>(`${environment.apiBaseUrl}/admin/photos`).subscribe((list) => {
        this.photos.set(list);
      });
    } else {
      this.galleryService.getWeddingPhotos(this.weddingId).subscribe((list) => this.photos.set(list));
    }
  }

  filteredPhotos() {
    const all = this.photos();
    const f = this.filter();
    if (f === 'pending') return all.filter((p) => !p.approved);
    if (f === 'highlighted') return all.filter((p) => p.highlighted);
    return all;
  }

  setFilter(value: 'all' | 'pending' | 'highlighted') {
    this.filter.set(value);
  }

  async approve(photo: Photo) {
    await this.http
      .patch(`${environment.apiBaseUrl}/admin/photos/${photo.id}`, {
        approved: true,
      })
      .toPromise();
    this.load();
  }

  async toggleHighlight(photo: Photo) {
    await this.http
      .patch(`${environment.apiBaseUrl}/admin/photos/${photo.id}`, {
        highlighted: !photo.highlighted,
      })
      .toPromise();
    this.load();
  }

  async remove(photo: Photo) {
    await this.http.delete(`${environment.apiBaseUrl}/admin/photos/${photo.id}`).toPromise();
    this.load();
  }
}

