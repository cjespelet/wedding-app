import { Component } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  standalone: false,
})
export class TabsPage {

  constructor(
    private auth: AuthService,
    /** Inicia polling de notificaciones al entrar a la app autenticada */
    _notifications: NotificationService,
  ) {}

  logout() {
    this.auth.logout();
  }

}
