import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService, AuthUser } from './core/services/auth.service';
import { AdminHeaderComponent } from './shared/components/admin-header/admin-header.component';
import { AdminMenuComponent } from './shared/components/admin-menu/admin-menu.component';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, AdminHeaderComponent, AdminMenuComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  protected readonly title = signal('Wedding Admin');

  currentUser = signal<AuthUser | null>(this.auth.getCurrentUser());

  constructor() {
    this.router.events.subscribe(() => {
      this.currentUser.set(this.auth.getCurrentUser());
    });
  }

  isLoginRoute(): boolean {
    return this.router.url.startsWith('/login');
  }

  get currentSectionName(): string {
    const url = this.router.url;
    if (url.startsWith('/dashboard')) return 'Dashboard';
    if (url.startsWith('/wedding')) return 'Configuración de la boda';
    if (url.startsWith('/guests')) return 'Invitados';
    if (url.startsWith('/gallery')) return 'Galería';
    if (url.startsWith('/dj-messages')) return 'Mensajes DJ';
    return '';
  }

  logout() {
    this.auth.logout();
  }
}
