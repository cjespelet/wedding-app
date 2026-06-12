import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { GalleryService, Photo } from '../services/gallery.service';

interface DisplayPhoto extends Photo {
  likes: number;
  uploadedBy?: string | null;
}

@Component({
  standalone: true,
  selector: 'app-display-gallery',
  templateUrl: './display-gallery.page.html',
  styleUrls: ['./display-gallery.page.scss'],
  imports: [CommonModule, IonicModule],
})
export class DisplayGalleryPage implements OnInit, OnDestroy {
  photos: DisplayPhoto[] = [];
  displayedPhotoIds: string[] = [];
  newPhotoQueue: DisplayPhoto[] = [];
  currentPhoto: DisplayPhoto | null = null;
  likesMap: Record<string, number> = {};

  // Animación de likes: contador por foto para disparar corazones flotantes
  likeBursts: Record<string, number> = {};

  // Control de polling
  polling = false;
  lastError: string | null = null;
  private pollingTimer: any;
  private pollIntervalMs = 3000;

  // Modo fiesta (por ahora sólo controla sutiles animaciones visuales, no rota fotos)
  partyMode = true;
  private partyTimer: any;
  private partyIntervalMs = 10000;

  // Hero de nueva foto
  heroDurationMs = 5000;
  private heroTimeout: any;

  // Para evitar flicker cuando aún no tenemos datos
  ready = false;

  private weddingId: string | null = null;
  private initialized = false; // primera carga de datos

  private readonly gridColumns = 6;
  private readonly visibleRows = 4;

  constructor(
    private route: ActivatedRoute,
    private galleryService: GalleryService,
  ) {}

  ngOnInit(): void {
    this.weddingId = this.route.snapshot.queryParamMap.get('weddingId');
    if (!this.weddingId) {
      // Si no hay weddingId, no rompemos la UI: mostramos mensaje y no arrancamos polling
      this.lastError = 'Falta el parámetro ?weddingId=... en la URL de /display.';
      return;
    }
    this.startPolling();
  }

  ngOnDestroy(): void {
    this.stopPolling();
    this.stopPartyMode();
    if (this.heroTimeout) {
      clearTimeout(this.heroTimeout);
      this.heroTimeout = null;
    }
  }

  trackByPhotoId(_index: number, photo: DisplayPhoto): string {
    return photo.id;
  }

  get visiblePhotos(): DisplayPhoto[] {
    const sorted = [...this.photos].sort((a, b) => {
      const da = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (da !== 0) return da;
      const la = (b.likes ?? 0) - (a.likes ?? 0);
      return la;
    });
    const limit = this.gridColumns * this.visibleRows;
    return sorted.slice(0, limit);
  }

  private startPolling(): void {
    if (this.pollingTimer || !this.weddingId) return;
    this.polling = true;
    this.scheduleNextPoll(0);
  }

  private stopPolling(): void {
    if (this.pollingTimer) {
      clearTimeout(this.pollingTimer);
      this.pollingTimer = null;
    }
    this.polling = false;
  }

  private scheduleNextPoll(delay: number): void {
    if (!this.polling) return;
    this.pollingTimer = setTimeout(() => this.pollOnce(), delay);
  }

  private pollOnce(): void {
    if (!this.weddingId) return;

    this.galleryService.listPublicByWedding(this.weddingId).subscribe({
      next: (photos) => {
        this.lastError = null;
        this.ready = true;
        this.applyDiff(photos as DisplayPhoto[]);
        this.scheduleNextPoll(this.pollIntervalMs);
      },
      error: (err) => {
        // Auto-recovery: registramos error pero no rompemos la UI ni limpiamos las fotos
        // eslint-disable-next-line no-console
        console.error('[DisplayGallery] poll error', err);
        this.lastError = 'Problema al actualizar la galería. Reintentando...';
        this.scheduleNextPoll(this.pollIntervalMs * 2);
      },
    });
  }

  private applyDiff(newPhotos: DisplayPhoto[]): void {
    // Pre-cargamos likes anteriores
    const previousLikes = { ...this.likesMap };

    // Normalizamos likes (aseguramos número)
    newPhotos = newPhotos.map((p) => ({
      ...p,
      likes: typeof p.likes === 'number' ? p.likes : 0,
    }));

    // Detectar nuevas fotos (primer vez que aparecen en /display),
    // pero sólo después de la primera carga completa.
    let hasNewOnes = false;
    let newOnes: DisplayPhoto[] = [];
    if (this.initialized) {
      const oldIds = new Set(this.photos.map((p) => p.id));
      newOnes = newPhotos.filter((p) => !oldIds.has(p.id));
      hasNewOnes = newOnes.length > 0;

      if (hasNewOnes) {
        this.newPhotoQueue.push(...newOnes);
        if (!this.currentPhoto) {
          this.playNextHero();
        }
      }
    }

    // Actualizamos fotos y mapa de likes
    this.photos = newPhotos;
    this.displayedPhotoIds = newPhotos.map((p) => p.id);
    this.likesMap = {};

    for (const p of newPhotos) {
      const prev = previousLikes[p.id] ?? 0;
      this.likesMap[p.id] = p.likes;
      if (this.initialized && p.likes > prev) {
        const diff = p.likes - prev;
        this.triggerLikeBurst(p.id, diff);

        // Cuando una foto recibe nuevos likes, la mostramos al centro con el efecto hero,
        // pero sólo si en este poll NO llegaron fotos nuevas (prioridad a fotos nuevas).
        if (!hasNewOnes) {
          if (this.heroTimeout) {
            clearTimeout(this.heroTimeout);
            this.heroTimeout = null;
          }
          this.currentPhoto = p;
          this.heroTimeout = setTimeout(() => {
            this.currentPhoto = null;
            this.heroTimeout = null;
          }, this.heroDurationMs);
        }
      }
    }

    // Marcamos que ya hicimos la primera carga completa;
    // a partir de ahora sí tratamos nuevas fotos / likes como eventos.
    this.initialized = true;
  }

  private playNextHero(): void {
    if (this.heroTimeout) {
      clearTimeout(this.heroTimeout);
      this.heroTimeout = null;
    }

    const next = this.newPhotoQueue.shift() ?? null;
    this.currentPhoto = next;

    if (next) {
      this.heroTimeout = setTimeout(() => {
        this.currentPhoto = null;
        this.heroTimeout = null;
      }, this.heroDurationMs);
    }
  }

  private triggerLikeBurst(photoId: string, count: number): void {
    if (!this.likeBursts[photoId]) {
      this.likeBursts[photoId] = 0;
    }
    this.likeBursts[photoId] += count;

    // Limpieza automática después de la animación (un poco más larga para que se vea mejor)
    setTimeout(() => {
      this.likeBursts[photoId] = Math.max(0, (this.likeBursts[photoId] || 0) - count);
    }, 3000);
  }

  /** PARTY MODE: cambia la foto destacada cada X segundos aun sin nuevas fotos */
  private startPartyMode(): void {
    if (this.partyTimer) return;
    this.partyTimer = setInterval(() => {
      if (!this.photos.length) return;
      const index = this.currentPhoto
        ? (this.photos.findIndex((p) => p.id === this.currentPhoto!.id) + 1) % this.photos.length
        : 0;
      this.currentPhoto = this.photos[index];
    }, this.partyIntervalMs);
  }

  private stopPartyMode(): void {
    if (this.partyTimer) {
      clearInterval(this.partyTimer);
      this.partyTimer = null;
    }
  }

  /** Utilidad de plantilla para repetir elementos (likes) */
  createArray(n: number | undefined): number[] {
    if (!n || n <= 0) return [];
    const count = Math.min(n, 6); // hasta 6 corazones simultáneos
    return Array.from({ length: count });
  }
}

