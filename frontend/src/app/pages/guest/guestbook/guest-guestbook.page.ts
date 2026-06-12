import { Component, inject, signal } from '@angular/core';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonButton,
  IonList,
} from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import { GuestbookService, GuestbookMessage } from '../../../core/services/guestbook.service';

@Component({
  standalone: true,
  selector: 'app-guest-guestbook',
  templateUrl: './guest-guestbook.page.html',
  styleUrls: ['./guest-guestbook.page.scss'],
  imports: [
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonItem,
    IonLabel,
    IonInput,
    IonTextarea,
    IonButton,
    IonList,
    FormsModule,
  ],
})
export class GuestGuestbookPage {
  private readonly guestbookService = inject(GuestbookService);

  readonly messages = signal<GuestbookMessage[]>([]);

  name = '';
  message = '';
  emoji = '❤️';

  // In a real app, weddingId comes from auth or route
  private readonly demoWeddingId = 'demo-wedding-id';

  constructor() {
    this.load();
  }

  load() {
    this.guestbookService.list(this.demoWeddingId).subscribe((list) => this.messages.set(list));
  }

  submit() {
    if (!this.name || !this.message) return;
    this.guestbookService.post({ name: this.name, message: this.message, emoji: this.emoji }).subscribe(() => {
      this.name = '';
      this.message = '';
      this.load();
    });
  }
}

