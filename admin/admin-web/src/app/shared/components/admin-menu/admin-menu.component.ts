import { Component, Input } from '@angular/core';
import { NgIf } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthUser } from '../../../core/services/auth.service';

@Component({
  selector: 'app-admin-menu',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, NgIf],
  templateUrl: './admin-menu.component.html',
  styleUrl: './admin-menu.component.scss',
})
export class AdminMenuComponent {
  @Input() user: AuthUser | null = null;

  get isDjOnly(): boolean {
    return this.user?.role === 'dj';
  }
}
