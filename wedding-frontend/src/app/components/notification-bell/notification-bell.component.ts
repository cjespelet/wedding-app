import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule, ToastController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import {
  AppNotification,
  NotificationService,
} from '../../services/notification.service';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './notification-bell.component.html',
  styleUrls: ['./notification-bell.component.scss'],
})
export class NotificationBellComponent implements OnInit, OnDestroy {
  unreadCount = 0;
  modalOpen = false;
  notifications: AppNotification[] = [];
  loading = false;
  hasMore = false;
  page = 0;

  private countSub?: Subscription;

  constructor(
    private notificationService: NotificationService,
    private router: Router,
    private toastCtrl: ToastController,
  ) {}

  ngOnInit(): void {
    this.countSub = this.notificationService.unreadCount$.subscribe((c) => (this.unreadCount = c));
  }

  ngOnDestroy(): void {
    this.countSub?.unsubscribe();
  }

  openModal(): void {
    this.modalOpen = true;
    this.page = 0;
    this.notifications = [];
    this.loadPage(0);
  }

  closeModal(): void {
    this.modalOpen = false;
  }

  loadPage(page: number): void {
    this.loading = true;
    this.notificationService.getNotifications(page, 25).subscribe({
      next: (res) => {
        this.notifications = page === 0 ? res.items : [...this.notifications, ...res.items];
        this.hasMore = res.hasMore;
        this.page = page;
        this.loading = false;
        this.notificationService.setUnreadCount(res.unreadCount);
      },
      error: () => {
        this.loading = false;
        void this.toastCtrl
          .create({ message: 'No se pudieron cargar las notificaciones', duration: 2000, color: 'danger' })
          .then((t) => t.present());
      },
    });
  }

  onInfinite(ev: Event): void {
    const target = ev.target as HTMLIonInfiniteScrollElement;
    if (!this.hasMore || this.loading) {
      void target.complete();
      return;
    }
    this.loading = true;
    const nextPage = this.page + 1;
    this.notificationService.getNotifications(nextPage, 25).subscribe({
      next: (res) => {
        this.notifications = [...this.notifications, ...res.items];
        this.hasMore = res.hasMore;
        this.page = nextPage;
        this.loading = false;
        this.notificationService.setUnreadCount(res.unreadCount);
        void target.complete();
      },
      error: () => {
        this.loading = false;
        void target.complete();
      },
    });
  }

  displayActor(n: AppNotification): string {
    const u = n.actor.username;
    if (u) return `@${u}`;
    return n.actor.fullName || 'Alguien';
  }

  async markOneRead(n: AppNotification): Promise<void> {
    if (!n.readAt) {
      this.notificationService.markRead(n.id).subscribe({
        next: () => {
          n.readAt = new Date().toISOString();
          this.notificationService.refreshUnread();
        },
        error: () => {
          /* */
        },
      });
    }
    await this.goToGallery(n.photoId);
  }

  markAllRead(): void {
    this.notificationService.markAllRead().subscribe({
      next: () => {
        this.notifications = this.notifications.map((n) => ({
          ...n,
          readAt: n.readAt ?? new Date().toISOString(),
        }));
        this.notificationService.refreshUnread();
      },
      error: () => {
        /* */
      },
    });
  }

  private async goToGallery(photoId: string | null): Promise<void> {
    this.closeModal();
    if (photoId) {
      await this.router.navigate(['/dashboard/gallery'], {
        queryParams: { highlight: photoId },
      });
    } else {
      await this.router.navigate(['/dashboard/gallery']);
    }
  }
}
