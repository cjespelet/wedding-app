import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-checkin-success',
  templateUrl: './checkin-success.page.html',
  styleUrls: ['./checkin-success.page.scss'],
  imports: [CommonModule, IonicModule],
})
export class CheckinSuccessPage implements OnInit {
  constructor(private router: Router) {}

  ngOnInit(): void {
    // Alias: mostramos el mismo contenido que el inicio (dashboard), cambiando solo el mensaje.
    this.router.navigateByUrl('/dashboard/dashboard?justCheckedIn=1', { replaceUrl: true });
  }

  goToGallery() {
    this.router.navigateByUrl('/dashboard/gallery');
  }
}

