import { Component, inject } from '@angular/core';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonItem,
  IonLabel,
  IonInput,
  IonToggle,
  IonTextarea,
  IonButton,
} from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import { RsvpService, RsvpPayload } from '../../../core/services/rsvp.service';

@Component({
  standalone: true,
  selector: 'app-guest-rsvp',
  templateUrl: './guest-rsvp.page.html',
  styleUrls: ['./guest-rsvp.page.scss'],
  imports: [
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonItem,
    IonLabel,
    IonInput,
    IonToggle,
    IonTextarea,
    IonButton,
    FormsModule,
  ],
})
export class GuestRsvpPage {
  private readonly rsvpService = inject(RsvpService);

  form: RsvpPayload = {
    attending: true,
    numberOfGuests: 1,
    dietaryRestrictions: '',
    comments: '',
  };

  submitting = false;
  submitted = false;

  submit() {
    if (this.submitting) return;
    this.submitting = true;
    this.rsvpService.submitRsvp(this.form).subscribe({
      next: () => {
        this.submitting = false;
        this.submitted = true;
      },
      error: () => {
        this.submitting = false;
      },
    });
  }
}

