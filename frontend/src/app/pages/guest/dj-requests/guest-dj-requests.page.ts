import { Component, inject } from '@angular/core';
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
import { DjService, SongRequest } from '../../../core/services/dj.service';

@Component({
  standalone: true,
  selector: 'app-guest-dj-requests',
  templateUrl: './guest-dj-requests.page.html',
  styleUrls: ['./guest-dj-requests.page.scss'],
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
export class GuestDjRequestsPage {
  private readonly djService = inject(DjService);

  title = '';
  artist = '';
  comment = '';
  submitting = false;

  trending: SongRequest[] = [];

  constructor() {
    this.loadTrending();
  }

  loadTrending() {
    this.djService.getRequestsForDj().subscribe((songs) => {
      this.trending = songs;
    });
  }

  submit() {
    if (!this.title || !this.artist) return;
    this.submitting = true;
    this.djService.createRequest(this.title, this.artist, this.comment).subscribe({
      next: () => {
        this.submitting = false;
        this.title = '';
        this.artist = '';
        this.comment = '';
        this.loadTrending();
      },
      error: () => {
        this.submitting = false;
      },
    });
  }

  upvote(song: SongRequest) {
    this.djService.vote(song.id).subscribe(() => this.loadTrending());
  }
}

