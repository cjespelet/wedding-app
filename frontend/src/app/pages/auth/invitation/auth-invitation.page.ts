import { Component, inject } from '@angular/core';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
} from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  standalone: true,
  selector: 'app-auth-invitation',
  templateUrl: './auth-invitation.page.html',
  styleUrls: ['./auth-invitation.page.scss'],
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, IonItem, IonLabel, IonInput, IonButton, FormsModule],
})
export class AuthInvitationPage {
  private readonly auth = inject(AuthService);

  code = '';
  name = '';
  loading = false;

  login() {
    if (this.loading) return;
    this.loading = true;
    this.auth.loginWithInvitation(this.code, this.name);
    this.loading = false;
  }
}

