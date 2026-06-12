import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardPage } from './dashboard.page';
import { CheckinSuccessPage } from '../checkin-success/checkin-success.page';
import { ScanQrPage } from '../scan-qr/scan-qr.page';

const routes: Routes = [
  {
    path: '',
    component: DashboardPage,
  },
  {
    path: 'checkin-success',
    component: CheckinSuccessPage,
  },
  {
    path: 'scan-qr',
    component: ScanQrPage,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DashboardPageRoutingModule {}
