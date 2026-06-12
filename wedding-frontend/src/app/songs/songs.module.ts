import { NgModule } from '@angular/core';
import { SongsPageRoutingModule } from './songs-routing.module';
import { SongsPage } from './songs.page';

@NgModule({
  imports: [SongsPageRoutingModule, SongsPage],
})
export class SongsPageModule {}

