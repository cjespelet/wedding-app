import { Component, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import type { AuthUser } from '../../../core/services/auth.service';

@Component({
  selector: 'app-admin-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './admin-header.component.html',
  styleUrl: './admin-header.component.scss',
})
export class AdminHeaderComponent {
  sectionName = input<string>('');
  user = input<AuthUser | null>(null);
  logoutClick = output<void>();

  onLogout(): void {
    this.logoutClick.emit();
  }
}
