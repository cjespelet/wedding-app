import { NgModule } from '@angular/core';
import { MenuPageRoutingModule } from './menu-routing.module';
import { MenuPage } from './menu.page';

@NgModule({
  imports: [MenuPageRoutingModule, MenuPage],
})
export class MenuPageModule {}

