import { Component, OnInit, inject, signal } from '@angular/core';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonList,
  IonItem,
  IonLabel,
} from '@ionic/angular/standalone';
import { DatePipe, NgIf, NgFor } from '@angular/common';
import { AdminService, AdminAnalytics, GuestWithRsvp } from '../../../core/services/admin.service';
import { RsvpService, RsvpStats } from '../../../core/services/rsvp.service';

@Component({
  standalone: true,
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.page.html',
  styleUrls: ['./admin-dashboard.page.scss'],
  imports: [
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonList,
    IonItem,
    IonLabel,
    NgIf,
    NgFor,
    DatePipe,
  ],
})
export class AdminDashboardPage implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly rsvpService = inject(RsvpService);

  readonly analytics = signal<AdminAnalytics | null>(null);
  readonly rsvpStats = signal<RsvpStats | null>(null);
  readonly recentGuests = signal<GuestWithRsvp[]>([]);

  ngOnInit(): void {
    this.load();
  }

  load() {
    this.adminService.getAnalytics().subscribe((data) => this.analytics.set(data));
    this.rsvpService.getStats().subscribe((stats) => this.rsvpStats.set(stats));
    this.adminService.getGuests().subscribe((guests) => {
      // Ordenar por fecha de último RSVP descendente y limitar a 5
      const sorted = [...guests].sort((a, b) => {
        const aDate = a.rsvps[0]?.createdAt ?? '';
        const bDate = b.rsvps[0]?.createdAt ?? '';
        return bDate.localeCompare(aDate);
      });
      this.recentGuests.set(sorted.slice(0, 5));
    });
  }
}

