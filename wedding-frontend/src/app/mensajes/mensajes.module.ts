import { IonicModule } from '@ionic/angular';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MensajesPage } from './mensajes.page';
import { ExploreContainerComponentModule } from '../explore-container/explore-container.module';

import { MensajesPageRoutingModule } from './mensajes-routing.module';

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    ExploreContainerComponentModule,
    MensajesPageRoutingModule
  ],
  declarations: [MensajesPage]
})
export class MensajesPageModule {}
