import { Component, inject, signal } from '@angular/core';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonGrid, IonRow, IonCol, IonImg } from '@ionic/angular/standalone';
import { GalleryService, Photo } from '../../../core/services/gallery.service';

@Component({
  standalone: true,
  selector: 'app-guest-gallery',
  templateUrl: './guest-gallery.page.html',
  styleUrls: ['./guest-gallery.page.scss'],
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, IonGrid, IonRow, IonCol, IonImg],
})
export class GuestGalleryPage {
  private readonly galleryService = inject(GalleryService);

  readonly photos = signal<Photo[]>([]);

  // In real app, derive weddingId from auth token or route
  private readonly demoWeddingId = 'demo-wedding-id';

  constructor() {
    this.load();
  }

  load() {
    this.galleryService.getWeddingPhotos(this.demoWeddingId).subscribe((photos) => this.photos.set(photos));
  }
}

