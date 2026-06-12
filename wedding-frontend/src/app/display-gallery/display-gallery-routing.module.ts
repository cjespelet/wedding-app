import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DisplayGalleryPage } from './display-gallery.page';

const routes: Routes = [
  {
    path: '',
    component: DisplayGalleryPage,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DisplayGalleryPageRoutingModule {}

