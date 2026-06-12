import { Component, OnInit, inject, signal, computed } from '@angular/core';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonList,
  IonChip,
} from '@ionic/angular/standalone';
import { NgFor, NgIf } from '@angular/common';
import { AdminService, GuestWithRsvp } from '../../../core/services/admin.service';

@Component({
  standalone: true,
  selector: 'app-admin-guests',
  templateUrl: './admin-guests.page.html',
  styleUrls: ['./admin-guests.page.scss'],
  imports: [
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonItem,
    IonLabel,
    IonSelect,
    IonSelectOption,
    IonList,
    IonChip,
    NgFor,
    NgIf,
  ],
})
export class AdminGuestsPage implements OnInit {
  private readonly adminService = inject(AdminService);

  readonly guests = signal<GuestWithRsvp[]>([]);
  readonly familyFilter = signal<string | 'all'>('all');
  readonly attendanceFilter = signal<'all' | 'yes' | 'no'>('all');

  readonly filteredGuests = computed(() => {
    return this.guests().filter((g) => {
      const latest = g.rsvps[0];
      const famOk = this.familyFilter() === 'all' || g.familyGroup === this.familyFilter();
      let attOk = true;
      if (this.attendanceFilter() === 'yes') attOk = !!latest?.attending;
      if (this.attendanceFilter() === 'no') attOk = latest ? !latest.attending : false;
      return famOk && attOk;
    });
  });

  readonly familyGroups = computed(() => {
    const set = new Set<string>();
    this.guests().forEach((g) => {
      if (g.familyGroup) set.add(g.familyGroup);
    });
    return Array.from(set).sort();
  });

  ngOnInit(): void {
    this.adminService.getGuests().subscribe((list) => {
      // ordenamos para que los que tienen RSVP reciente aparezcan primero
      const sorted = [...list].sort((a, b) => {
        const aDate = a.rsvps[0]?.createdAt ?? '';
        const bDate = b.rsvps[0]?.createdAt ?? '';
        return bDate.localeCompare(aDate);
      });
      this.guests.set(sorted);
    });
  }
}

