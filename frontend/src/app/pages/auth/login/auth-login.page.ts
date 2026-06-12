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
  selector: 'app-auth-login',
  templateUrl: './auth-login.page.html',
  styleUrls: ['./auth-login.page.scss'],
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, IonItem, IonLabel, IonInput, IonButton, FormsModule],
})
export class AuthLoginPage {
  private readonly auth = inject(AuthService);

  email = '';
  password = '';
  loading = false;

  login() {
    if (this.loading) return;
    this.loading = true;
    this.auth.loginAdmin(this.email, this.password);
    this.loading = false;
  }
}

