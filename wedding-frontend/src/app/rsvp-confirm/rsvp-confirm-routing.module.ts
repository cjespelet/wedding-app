import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RsvpConfirmPage } from './rsvp-confirm.page';

const routes: Routes = [
  {
    path: '',
    component: RsvpConfirmPage,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RsvpConfirmPageRoutingModule {}

