import { Component, OnInit, inject } from '@angular/core';
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
} from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import { WeddingService, WeddingInfo } from '../../../core/services/wedding.service';

@Component({
  standalone: true,
  selector: 'app-admin-wedding-settings',
  templateUrl: './admin-wedding-settings.page.html',
  styleUrls: ['./admin-wedding-settings.page.scss'],
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, IonItem, IonLabel, IonInput, IonTextarea, IonButton, FormsModule],
})
export class AdminWeddingSettingsPage implements OnInit {
  private readonly weddingService = inject(WeddingService);

  wedding: Partial<WeddingInfo> = {};
  loading = false;
  saved = false;

  ngOnInit(): void {
    this.loading = true;
    this.weddingService.getOwnWedding().subscribe({
      next: (w) => {
        this.wedding = { ...w };
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  save() {
    if (!this.wedding) return;
    this.loading = true;
    this.saved = false;
    this.weddingService.updateWedding(this.wedding).subscribe({
      next: (w) => {
        this.wedding = w;
        this.loading = false;
        this.saved = true;
      },
      error: () => {
        this.loading = false;
      },
    });
  }
}

