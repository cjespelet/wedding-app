import { IonicModule } from '@ionic/angular';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DashboardPage } from './dashboard.page';
import { ExploreContainerComponentModule } from '../explore-container/explore-container.module';
import { ScanQrPage } from '../scan-qr/scan-qr.page';

import { DashboardPageRoutingModule } from './dashboard-routing.module';
import { NotificationBellComponent } from '../components/notification-bell/notification-bell.component';

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    ExploreContainerComponentModule,
    DashboardPageRoutingModule,
    ScanQrPage,
    NotificationBellComponent,
  ],
  declarations: [DashboardPage],
})
export class DashboardPageModule {}
