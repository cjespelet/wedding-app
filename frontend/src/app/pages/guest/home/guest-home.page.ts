import { Component, inject, signal } from '@angular/core';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonText, IonButton } from '@ionic/angular/standalone';
import { AsyncPipe, DatePipe } from '@angular/common';
import { WeddingService, WeddingInfo } from '../../../core/services/wedding.service';

@Component({
  standalone: true,
  selector: 'app-guest-home',
  templateUrl: './guest-home.page.html',
  styleUrls: ['./guest-home.page.scss'],
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, IonText, IonButton, AsyncPipe, DatePipe],
})
export class GuestHomePage {
  private readonly weddingService = inject(WeddingService);

  readonly wedding = signal<WeddingInfo | null>(null);

  // In a real app, slug comes from routing or config
  private readonly demoSlug = 'demo-wedding';

  constructor() {
    this.loadWedding();
  }

  loadWedding() {
    this.weddingService.getWeddingBySlug(this.demoSlug).subscribe((wedding) => this.wedding.set(wedding));
  }
}

