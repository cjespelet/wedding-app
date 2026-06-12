import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.module').then(m => m.AuthModule),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadChildren: () => import('./tabs/tabs.module').then(m => m.TabsPageModule),
  },
  {
    path: 'rsvp/confirm',
    canActivate: [authGuard],
    loadChildren: () => import('./rsvp-confirm/rsvp-confirm.module').then(m => m.RsvpConfirmPageModule),
  },
  {
    path: 'display',
    loadChildren: () => import('./display-gallery/display-gallery.module').then(m => m.DisplayGalleryPageModule),
  },
  {
    path: 'checkin/welcome',
    loadComponent: () =>
      import('./checkin-public-welcome/checkin-public-welcome.page').then(
        (m) => m.CheckinPublicWelcomePage,
      ),
  },
  {
    path: '',
    redirectTo: '/auth/login',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: '/auth/login',
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
