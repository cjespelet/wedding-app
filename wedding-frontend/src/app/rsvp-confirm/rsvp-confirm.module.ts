import { NgModule } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RsvpConfirmPage } from './rsvp-confirm.page';
import { RsvpConfirmPageRoutingModule } from './rsvp-confirm-routing.module';

@NgModule({
  imports: [IonicModule, CommonModule, ReactiveFormsModule, RsvpConfirmPageRoutingModule, RsvpConfirmPage],
})
export class RsvpConfirmPageModule {}

