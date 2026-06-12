import { Routes } from '@angular/router';

import { GuestHomePage } from './pages/guest/home/guest-home.page';
import { GuestRsvpPage } from './pages/guest/rsvp/guest-rsvp.page';
import { GuestGalleryPage } from './pages/guest/gallery/guest-gallery.page';
import { GuestDjRequestsPage } from './pages/guest/dj-requests/guest-dj-requests.page';
import { GuestGuestbookPage } from './pages/guest/guestbook/guest-guestbook.page';
import { AdminDashboardPage } from './pages/admin/dashboard/admin-dashboard.page';
import { AdminWeddingSettingsPage } from './pages/admin/wedding-settings/admin-wedding-settings.page';
import { AdminGuestsPage } from './pages/admin/guests/admin-guests.page';
import { AdminPhotosPage } from './pages/admin/photos/admin-photos.page';
import { AuthLoginPage } from './pages/auth/login/auth-login.page';
import { AuthInvitationPage } from './pages/auth/invitation/auth-invitation.page';
import { authGuard } from './core/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'guest/home', pathMatch: 'full' },

  // Autenticación
  { path: 'auth/login', component: AuthLoginPage },
  { path: 'auth/invitation', component: AuthInvitationPage },

  // Invitados
  { path: 'guest/home', component: GuestHomePage },
  { path: 'guest/rsvp', component: GuestRsvpPage },
  { path: 'guest/gallery', component: GuestGalleryPage },
  { path: 'guest/dj-requests', component: GuestDjRequestsPage },
  { path: 'guest/guestbook', component: GuestGuestbookPage },

  // Admin (protegido)
  { path: 'admin/dashboard', component: AdminDashboardPage, canActivate: [authGuard] },
  { path: 'admin/wedding-settings', component: AdminWeddingSettingsPage, canActivate: [authGuard] },
  { path: 'admin/guests', component: AdminGuestsPage, canActivate: [authGuard] },
  { path: 'admin/photos', component: AdminPhotosPage, canActivate: [authGuard] },

  // TODO: añadir rutas para DJ, fotógrafo, etc.
];

