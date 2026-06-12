import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';
import { loginGuard } from './core/login.guard';
import { roleGuard } from './core/role.guard';
import { LoginPage } from './pages/login/login.page';
import { DashboardPage } from './pages/dashboard/dashboard.page';
import { WeddingSettingsPage } from './pages/wedding-settings/wedding-settings.page';
import { GuestListPage } from './pages/guests/guest-list.page';
import { PhotoGalleryManagerPage } from './pages/photos/photo-gallery-manager.page';
import { MenuManagerPage } from './pages/menu/menu-manager/menu-manager.page';
import { DjMessagesPage } from './pages/dj-messages/dj-messages.page';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  { path: 'login', component: LoginPage, canActivate: [loginGuard] },

  {
    path: '',
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        component: DashboardPage,
        canActivate: [roleGuard],
        data: { roles: ['super_admin', 'wedding_admin'] },
      },
      {
        path: 'wedding',
        component: WeddingSettingsPage,
        canActivate: [roleGuard],
        data: { roles: ['super_admin', 'wedding_admin'] },
      },
      {
        path: 'guests',
        component: GuestListPage,
        canActivate: [roleGuard],
        data: { roles: ['super_admin', 'wedding_admin'] },
      },
      {
        path: 'gallery',
        component: PhotoGalleryManagerPage,
        canActivate: [roleGuard],
        data: { roles: ['super_admin', 'wedding_admin'] },
      },
      {
        path: 'dj-messages',
        component: DjMessagesPage,
        canActivate: [roleGuard],
        data: { roles: ['super_admin', 'wedding_admin', 'dj'] },
      },
      {
        path: 'menu',
        component: MenuManagerPage,
        canActivate: [roleGuard],
        data: { roles: ['super_admin', 'wedding_admin'] },
      },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
