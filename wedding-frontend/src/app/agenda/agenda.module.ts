import { IonicModule } from '@ionic/angular';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AgendaPage } from './agenda.page';
import { ExploreContainerComponentModule } from '../explore-container/explore-container.module';

import { AgendaPageRoutingModule } from './agenda-routing.module';

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    ExploreContainerComponentModule,
    AgendaPageRoutingModule
  ],
  declarations: [AgendaPage]
})
export class AgendaPageModule {}
