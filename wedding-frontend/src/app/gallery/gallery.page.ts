import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ActionSheetController, IonicModule, ToastController } from '@ionic/angular';
import {
  CommentItem,
  FeedPhoto,
  GalleryService,
  PhotoLikeUser,
} from '../services/gallery.service';
import { WeddingService } from '../services/wedding.service';
import { AuthService } from '../services/auth.service';
import { Capacitor } from '@capacitor/core';
import { Camera, CameraSource, CameraResultType } from '@capacitor/camera';
import { Clipboard } from '@capacitor/clipboard';
import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { NotificationBellComponent } from '../components/notification-bell/notification-bell.component';

@Component({
  standalone: true,
  selector: 'app-gallery',
  templateUrl: './gallery.page.html',
  styleUrls: ['./gallery.page.scss'],
  imports: [CommonModule, IonicModule, FormsModule, NotificationBellComponent],
})
export class GalleryPage implements OnInit, OnDestroy {
  feedItems: FeedPhoto[] = [];
  loading = false;
  loadingMore = false;
  page = 0;
  hasMore = true;
  filterMode: 'all' | 'mine' = 'all';

  selectedPhoto: FeedPhoto | null = null;
  allowPhotoSharing = false;
  guestCanSharePhotos = false;
  private autoRefreshId: ReturnType<typeof setInterval> | null = null;
  /** Polling del feed (likes/comentarios en vivo) */
  private feedPollId: ReturnType<typeof setInterval> | null = null;

  /** Modal lista de likes */
  likesModalOpen = false;
  likesModalPhoto: FeedPhoto | null = null;
  likesModalUsers: PhotoLikeUser[] = [];

  /** Modal comentarios (quién escribió + texto) */
  commentsModalOpen = false;
  commentsModalPhoto: FeedPhoto | null = null;
  commentsModalItems: CommentItem[] = [];
  commentsModalLoading = false;
  commentsModalHasMore = false;
  commentsModalPage = 0;
  commentsModalDraft = '';
  postingCommentModal = false;

  /** Comentarios dentro del modal de detalle de foto */
  photoDetailComments: CommentItem[] = [];
  photoDetailLoading = false;
  photoDetailHasMore = false;
  photoDetailPage = 0;
  photoDetailDraft = '';
  postingDetailComment = false;

  constructor(
    private galleryService: GalleryService,
    private weddingService: WeddingService,
    private authService: AuthService,
    private toastCtrl: ToastController,
    private actionSheetCtrl: ActionSheetController,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit() {
    this.refreshWeddingAndFeed();
    this.autoRefreshId = setInterval(() => {
      this.weddingService.getCurrentWedding().subscribe({
        next: (w) => {
          if (w && typeof w.allowPhotoSharing === 'boolean') {
            this.allowPhotoSharing = w.allowPhotoSharing;
          }
        },
        error: () => {
          /* */
        },
      });
    }, 5 * 60 * 1000);
  }

  ionViewWillEnter() {
    this.refreshWeddingAndFeed();
    this.startFeedPoll();
  }

  ionViewWillLeave() {
    this.stopFeedPoll();
  }

  ngOnDestroy() {
    if (this.autoRefreshId) {
      clearInterval(this.autoRefreshId);
      this.autoRefreshId = null;
    }
    this.stopFeedPoll();
  }

  private startFeedPoll(): void {
    this.stopFeedPoll();
    this.feedPollId = setInterval(() => this.pollFeedMerge(), 18000);
  }

  private stopFeedPoll(): void {
    if (this.feedPollId) {
      clearInterval(this.feedPollId);
      this.feedPollId = null;
    }
  }

  /** Actualiza contadores del feed sin recargar toda la página */
  private pollFeedMerge(): void {
    if (this.loading || this.loadingMore) return;
    const mine = this.filterMode === 'mine';
    this.galleryService.getFeed(0, 15, mine).subscribe({
      next: (res) => {
        this.mergeFeedItems(res.items);
      },
      error: () => {
        /* */
      },
    });
  }

  private mergeFeedItems(fresh: FeedPhoto[]): void {
    const byId = new Map(fresh.map((p) => [p.id, p]));
    this.feedItems = this.feedItems.map((p) => {
      const upd = byId.get(p.id);
      if (!upd) return p;
      return {
        ...p,
        likes: upd.likes,
        likesCount: upd.likesCount,
        likedByMe: upd.likedByMe,
        commentsCount: upd.commentsCount,
      };
    });
    const existingIds = new Set(this.feedItems.map((x) => x.id));
    const brandNew = fresh.filter((p) => !existingIds.has(p.id));
    if (brandNew.length) {
      this.feedItems = [...brandNew, ...this.feedItems];
    }
  }

  /** Desde notificación (?highlight=photoId): abre el modal con la foto y comentarios */
  private openPhotoFromHighlight(photoId: string): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { highlight: null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
    const found = this.feedItems.find((p) => p.id === photoId);
    if (found) {
      this.openPhoto(found);
      return;
    }
    this.galleryService.getPhotoDetail(photoId).subscribe({
      next: (photo) => {
        if (!this.feedItems.some((p) => p.id === photo.id)) {
          this.feedItems = [photo, ...this.feedItems];
        }
        this.openPhoto(photo);
      },
      error: () => {
        void this.toastCtrl
          .create({
            message: 'No se pudo abrir la foto',
            duration: 2500,
            color: 'danger',
          })
          .then((t) => t.present());
      },
    });
  }

  onFilterChange() {
    this.loadFeed(true);
  }

  load(event?: { target?: { complete?: () => void } }) {
    this.loadFeed(true, event);
  }

  loadFeed(reset = true, refresherEvent?: { target?: { complete?: () => void } }) {
    if (reset) {
      this.page = 0;
      this.hasMore = true;
      this.feedItems = [];
    }
    this.loading = reset;
    const mine = this.filterMode === 'mine';
    this.galleryService.getFeed(this.page, 15, mine).subscribe({
      next: (res) => {
        this.feedItems = reset ? res.items : [...this.feedItems, ...res.items];
        this.hasMore = res.hasMore;
        this.page = res.page + 1;
        this.loading = false;
        this.loadingMore = false;
        refresherEvent?.target?.complete?.();
        if (reset) {
          const h = this.route.snapshot.queryParamMap.get('highlight');
          if (h) {
            setTimeout(() => this.openPhotoFromHighlight(h), 450);
          }
        }
      },
      error: () => {
        this.loading = false;
        this.loadingMore = false;
        refresherEvent?.target?.complete?.();
      },
    });
  }

  loadMore(ev: { target?: { complete?: () => void } }) {
    if (!this.hasMore || this.loadingMore) {
      ev.target?.complete?.();
      return;
    }
    this.loadingMore = true;
    const mine = this.filterMode === 'mine';
    this.galleryService.getFeed(this.page, 15, mine).subscribe({
      next: (res) => {
        this.feedItems = [...this.feedItems, ...res.items];
        this.hasMore = res.hasMore;
        this.page = res.page + 1;
        this.loadingMore = false;
        ev.target?.complete?.();
      },
      error: () => {
        this.loadingMore = false;
        ev.target?.complete?.();
      },
    });
  }

  private refreshWeddingAndFeed(showLoader = true) {
    if (showLoader) {
      this.loadFeed(true);
    }

    this.weddingService.getCurrentWedding().subscribe({
      next: (w) => {
        if (w && typeof w.allowPhotoSharing === 'boolean') {
          this.allowPhotoSharing = w.allowPhotoSharing;
        } else {
          this.allowPhotoSharing = false;
        }
      },
      error: () => {
        this.allowPhotoSharing = false;
      },
    });
  }

  displayHandle(photo: FeedPhoto): string {
    const u = photo.author?.username;
    if (u) return `@${u}`;
    return 'Fotógrafo';
  }

  /** Foto subida por el invitado actual */
  isMyPhoto(photo: FeedPhoto): boolean {
    const me = this.authService.getCurrentUser();
    return !!(me && photo.author?.id && photo.author.id === me.id);
  }

  /**
   * Corazón: en **tus** fotos → abre la lista de quién dio me gusta (solo el autor puede verla).
   * En fotos de otros → alterna me gusta / quita el tuyo.
   */
  onHeartClick(photo: FeedPhoto, event?: Event): void {
    event?.stopPropagation();
    if (this.isMyPhoto(photo)) {
      this.openLikesModal(photo, event);
      return;
    }
    this.toggleLike(photo, event);
  }

  toggleLike(photo: FeedPhoto, event?: Event) {
    event?.stopPropagation();
    this.galleryService.toggleLikePhoto(photo.id).subscribe({
      next: (r) => {
        this.patchPhoto(photo.id, {
          likes: r.likes,
          likesCount: r.likesCount,
          likedByMe: r.likedByMe,
        });
      },
      error: () => {
        void this.toastCtrl
          .create({ message: 'No se pudo actualizar el like', duration: 2000, color: 'danger' })
          .then((t) => t.present());
      },
    });
  }

  private patchPhoto(id: string, partial: Partial<FeedPhoto>) {
    this.feedItems = this.feedItems.map((p) => (p.id === id ? { ...p, ...partial } : p));
    if (this.selectedPhoto?.id === id) {
      this.selectedPhoto = { ...this.selectedPhoto, ...partial };
    }
  }

  openLikesModal(photo: FeedPhoto, event?: Event) {
    event?.stopPropagation();
    if (!this.isMyPhoto(photo)) {
      return;
    }
    this.likesModalPhoto = photo;
    this.galleryService.getPhotoLikes(photo.id).subscribe({
      next: (res) => {
        this.likesModalUsers = res.users;
        this.likesModalOpen = true;
      },
      error: (err: HttpErrorResponse) => {
        if (err.status === 403) {
          void this.toastCtrl
            .create({
              message: 'Solo el autor de la foto puede ver quién dio me gusta.',
              duration: 2500,
              color: 'medium',
            })
            .then((t) => t.present());
          return;
        }
        void this.toastCtrl
          .create({ message: 'No se pudo cargar los likes', duration: 2000, color: 'danger' })
          .then((t) => t.present());
      },
    });
  }

  closeLikesModal() {
    this.likesModalOpen = false;
    this.likesModalPhoto = null;
    this.likesModalUsers = [];
  }

  openCommentsModal(photo: FeedPhoto, event?: Event) {
    event?.stopPropagation();
    this.commentsModalPhoto = photo;
    this.commentsModalDraft = '';
    this.commentsModalPage = 0;
    this.commentsModalItems = [];
    this.commentsModalLoading = true;
    this.commentsModalOpen = true;
    this.galleryService.getComments(photo.id, 0).subscribe({
      next: (res) => {
        this.commentsModalItems = res.items;
        this.commentsModalHasMore = res.hasMore;
        this.commentsModalPage = 1;
        this.commentsModalLoading = false;
      },
      error: () => {
        this.commentsModalLoading = false;
        void this.toastCtrl
          .create({ message: 'No se pudieron cargar comentarios', duration: 2000, color: 'danger' })
          .then((t) => t.present());
      },
    });
  }

  closeCommentsModal() {
    this.commentsModalOpen = false;
    this.commentsModalPhoto = null;
    this.commentsModalItems = [];
    this.commentsModalDraft = '';
    this.commentsModalHasMore = false;
  }

  loadMoreCommentsModal(ev?: { target?: { complete?: () => void } }) {
    const photo = this.commentsModalPhoto;
    if (!photo || !this.commentsModalHasMore || this.commentsModalLoading) {
      ev?.target?.complete?.();
      return;
    }
    this.commentsModalLoading = true;
    this.galleryService.getComments(photo.id, this.commentsModalPage).subscribe({
      next: (res) => {
        this.commentsModalItems = [...this.commentsModalItems, ...res.items];
        this.commentsModalHasMore = res.hasMore;
        this.commentsModalPage += 1;
        this.commentsModalLoading = false;
        ev?.target?.complete?.();
      },
      error: () => {
        this.commentsModalLoading = false;
        ev?.target?.complete?.();
      },
    });
  }

  submitCommentFromModal() {
    const photo = this.commentsModalPhoto;
    if (!photo) return;
    const text = this.commentsModalDraft.trim();
    if (!text.length) return;
    this.postingCommentModal = true;
    this.galleryService.postComment(photo.id, text).subscribe({
      next: (c) => {
        this.commentsModalItems = [...this.commentsModalItems, c];
        this.commentsModalDraft = '';
        this.patchPhoto(photo.id, { commentsCount: (photo.commentsCount ?? 0) + 1 });
        this.postingCommentModal = false;
        if (this.commentsModalPhoto) {
          this.commentsModalPhoto = {
            ...this.commentsModalPhoto,
            commentsCount: (this.commentsModalPhoto.commentsCount ?? 0) + 1,
          };
        }
      },
      error: () => {
        this.postingCommentModal = false;
        void this.toastCtrl
          .create({ message: 'No se pudo publicar', duration: 2000, color: 'danger' })
          .then((t) => t.present());
      },
    });
  }

  toggleCommentLikeModal(comment: CommentItem, event?: Event) {
    event?.stopPropagation();
    const photo = this.commentsModalPhoto;
    if (!photo) return;
    this.galleryService.toggleCommentLike(comment.id).subscribe({
      next: (r) => {
        this.commentsModalItems = this.commentsModalItems.map((c) =>
          c.id === comment.id ? { ...c, likesCount: r.likesCount, likedByMe: r.likedByMe } : c,
        );
      },
      error: () => {
        /* */
      },
    });
  }

  openPhoto(photo: FeedPhoto) {
    this.selectedPhoto = photo;
    this.loadPhotoDetailComments(photo.id, true);
    this.guestCanSharePhotos = false;
    this.weddingService.getCurrentWedding().subscribe({
      next: (w) => {
        if (w && typeof w.allowPhotoSharing === 'boolean') {
          this.allowPhotoSharing = w.allowPhotoSharing;
        }
      },
      error: () => {
        /* */
      },
    });
    this.galleryService.checkShareStatus().subscribe({
      next: () => {
        this.guestCanSharePhotos = true;
      },
      error: (err) => {
        const code = err?.error?.code;
        if (code === 'SHARING_DISABLED_GLOBALLY') {
          this.allowPhotoSharing = false;
        }
        this.guestCanSharePhotos = false;
      },
    });
  }

  closePhoto() {
    this.selectedPhoto = null;
    this.photoDetailComments = [];
    this.photoDetailDraft = '';
    this.photoDetailHasMore = false;
    this.photoDetailPage = 0;
    this.photoDetailLoading = false;
  }

  private loadPhotoDetailComments(photoId: string, reset: boolean): void {
    if (reset) {
      this.photoDetailComments = [];
      this.photoDetailPage = 0;
      this.photoDetailHasMore = false;
    }
    this.photoDetailLoading = true;
    const page = reset ? 0 : this.photoDetailPage;
    this.galleryService.getComments(photoId, page).subscribe({
      next: (res) => {
        this.photoDetailComments = reset ? res.items : [...this.photoDetailComments, ...res.items];
        this.photoDetailHasMore = res.hasMore;
        this.photoDetailPage = page + 1;
        this.photoDetailLoading = false;
      },
      error: () => {
        this.photoDetailLoading = false;
        void this.toastCtrl
          .create({ message: 'No se pudieron cargar los comentarios', duration: 2000, color: 'danger' })
          .then((t) => t.present());
      },
    });
  }

  loadMorePhotoDetailComments(ev?: { target?: { complete?: () => void } }): void {
    const photo = this.selectedPhoto;
    if (!photo || !this.photoDetailHasMore || this.photoDetailLoading) {
      ev?.target?.complete?.();
      return;
    }
    this.photoDetailLoading = true;
    this.galleryService.getComments(photo.id, this.photoDetailPage).subscribe({
      next: (res) => {
        this.photoDetailComments = [...this.photoDetailComments, ...res.items];
        this.photoDetailHasMore = res.hasMore;
        this.photoDetailPage += 1;
        this.photoDetailLoading = false;
        ev?.target?.complete?.();
      },
      error: () => {
        this.photoDetailLoading = false;
        ev?.target?.complete?.();
      },
    });
  }

  submitCommentFromDetail(): void {
    const photo = this.selectedPhoto;
    if (!photo) return;
    const text = this.photoDetailDraft.trim();
    if (!text.length) return;
    this.postingDetailComment = true;
    this.galleryService.postComment(photo.id, text).subscribe({
      next: (c) => {
        this.photoDetailComments = [...this.photoDetailComments, c];
        this.photoDetailDraft = '';
        this.patchPhoto(photo.id, { commentsCount: (photo.commentsCount ?? 0) + 1 });
        this.postingDetailComment = false;
      },
      error: () => {
        this.postingDetailComment = false;
        void this.toastCtrl
          .create({ message: 'No se pudo publicar', duration: 2000, color: 'danger' })
          .then((t) => t.present());
      },
    });
  }

  toggleCommentLikeDetail(comment: CommentItem, event?: Event): void {
    event?.stopPropagation();
    const photo = this.selectedPhoto;
    if (!photo) return;
    this.galleryService.toggleCommentLike(comment.id).subscribe({
      next: (r) => {
        this.photoDetailComments = this.photoDetailComments.map((c) =>
          c.id === comment.id ? { ...c, likesCount: r.likesCount, likedByMe: r.likedByMe } : c,
        );
      },
      error: () => {
        /* */
      },
    });
  }

  private async sharePhotoWeb(): Promise<'cancelled' | 'shared' | 'clipboard'> {
    if (!this.selectedPhoto) {
      return 'cancelled';
    }
    const url = this.selectedPhoto.largeUrl || this.selectedPhoto.originalUrl;

    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: 'Foto de la boda',
          text: 'Compartí este momento en tus redes 💛',
          url,
        });
        return 'shared';
      } catch (e: unknown) {
        const name = e && typeof e === 'object' && 'name' in e ? (e as { name?: string }).name : '';
        if (name === 'AbortError') {
          return 'cancelled';
        }
      }
    }

    try {
      const resp = await fetch(url, { mode: 'cors', credentials: 'omit' });
      if (resp.ok) {
        const blob = await resp.blob();
        const ext = this.guessImageExtension(blob.type) ?? 'jpg';
        const file = new File([blob], `foto-boda.${ext}`, {
          type: blob.type || 'image/jpeg',
        });
        if (
          typeof navigator.share === 'function' &&
          typeof navigator.canShare === 'function' &&
          navigator.canShare({ files: [file] })
        ) {
          try {
            await navigator.share({
              files: [file],
              title: 'Foto de la boda',
              text: 'Compartí esta foto en tus redes.',
            });
            return 'shared';
          } catch (e: unknown) {
            const name = e && typeof e === 'object' && 'name' in e ? (e as { name?: string }).name : '';
            if (name === 'AbortError') {
              return 'cancelled';
            }
          }
        }
      }
    } catch {
      /* */
    }

    try {
      await Share.share({
        title: 'Foto de la boda',
        text: 'Compartí esta foto en tus redes.',
        url,
        dialogTitle: 'Compartir foto',
      });
      return 'shared';
    } catch (e: unknown) {
      const name = e && typeof e === 'object' && 'name' in e ? (e as { name?: string }).name : '';
      const msg = String(e ?? '');
      if (name === 'AbortError' || msg.includes('cancel') || msg.includes('Share canceled')) {
        return 'cancelled';
      }
    }

    await this.copyToClipboard(url);
    const t = await this.toastCtrl.create({
      message: 'Enlace copiado. Pegalo en WhatsApp, Instagram o donde quieras.',
      duration: 3500,
      position: 'bottom',
      color: 'dark',
    });
    await t.present();
    return 'clipboard';
  }

  async shareCurrentPhoto() {
    if (!this.selectedPhoto) return;

    if (Capacitor.isNativePlatform()) {
      this.galleryService.registerShare(this.selectedPhoto.id).subscribe({
        next: async () => {
          await this.shareNativeImage();
        },
        error: (err) => this.handleRegisterShareError(err),
      });
      return;
    }

    const outcome = await this.sharePhotoWeb();
    if (outcome === 'cancelled') {
      return;
    }

    this.galleryService.registerShare(this.selectedPhoto.id).subscribe({
      next: () => {
        this.galleryService.checkShareStatus().subscribe({
          next: (s) => {
            if (s.remaining === 0) {
              this.guestCanSharePhotos = false;
            }
          },
          error: () => {
            /* ignore */
          },
        });
      },
      error: (err) => this.handleRegisterShareError(err),
    });
  }

  private handleRegisterShareError(err: { error?: { code?: string; error?: string } }) {
    const code = err?.error?.code;
    if (code === 'SHARING_DISABLED_GLOBALLY') {
      this.allowPhotoSharing = false;
      return;
    }
    if (code === 'SHARING_DISABLED_FOR_GUEST') {
      this.guestCanSharePhotos = false;
      return;
    }
    const msg =
      err?.error?.error ||
      (code === 'SHARING_LIMIT_REACHED'
        ? 'Ya alcanzaste el máximo de veces que podés compartir fotos.'
        : 'No se pudo registrar el compartido. Intentalo más tarde.');
    void this.toastCtrl
      .create({
        message: msg,
        duration: 4000,
        position: 'bottom',
        color: 'warning',
      })
      .then((toast) => toast.present());
  }

  private async shareNativeImage() {
    if (!this.selectedPhoto) return;
    const url = this.selectedPhoto.largeUrl || this.selectedPhoto.originalUrl;

    try {
      const fileUri = await this.downloadToCache(url);
      await Share.share({
        title: 'Foto de la boda',
        text: 'Compartí esta foto en tus redes.',
        files: [fileUri],
        dialogTitle: 'Compartir foto',
      });
    } catch {
      await this.sharePhotoWeb();
    }
  }

  private async copyToClipboard(text: string) {
    try {
      if (Capacitor.isNativePlatform()) {
        await Clipboard.write({ string: text });
        return;
      }
    } catch {
      /* */
    }

    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* */
    }
  }

  private async downloadToCache(remoteUrl: string): Promise<string> {
    const resp = await fetch(remoteUrl);
    if (!resp.ok) throw new Error('download failed');
    const blob = await resp.blob();
    const base64 = await this.blobToBase64(blob);
    const ext = this.guessImageExtension(blob.type) ?? 'jpg';
    const fileName = `wedding-photo-${Date.now()}.${ext}`;

    const written = await Filesystem.writeFile({
      path: fileName,
      data: base64,
      directory: Directory.Cache,
    });

    return written.uri;
  }

  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('base64 conversion failed'));
      reader.onload = () => {
        const result = String(reader.result || '');
        const commaIdx = result.indexOf(',');
        resolve(commaIdx >= 0 ? result.slice(commaIdx + 1) : result);
      };
      reader.readAsDataURL(blob);
    });
  }

  private guessImageExtension(mime: string): string | null {
    if (mime === 'image/jpeg' || mime === 'image/jpg') return 'jpg';
    if (mime === 'image/png') return 'png';
    if (mime === 'image/webp') return 'webp';
    return null;
  }

  /** Menú: cámara o elegir foto del dispositivo (nativo y web). */
  async presentUploadOptions(
    cameraInput: HTMLInputElement,
    galleryInput: HTMLInputElement,
  ): Promise<void> {
    const sheet = await this.actionSheetCtrl.create({
      header: 'Subir foto',
      buttons: [
        {
          text: 'Tomar foto',
          icon: 'camera',
          handler: () => {
            if (Capacitor.isNativePlatform()) {
              void this.pickPhotoFromNative(CameraSource.Camera);
            } else {
              cameraInput.click();
            }
          },
        },
        {
          text: 'Elegir de la galería',
          icon: 'images',
          handler: () => {
            if (Capacitor.isNativePlatform()) {
              void this.pickPhotoFromNative(CameraSource.Photos);
            } else {
              galleryInput.click();
            }
          },
        },
        {
          text: 'Cancelar',
          role: 'cancel',
        },
      ],
    });
    await sheet.present();
  }

  private async pickPhotoFromNative(source: CameraSource): Promise<void> {
    try {
      const photo = await Camera.getPhoto({
        source,
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Uri,
      });
      const blob = await this.fetchBlobFromCameraPath(photo.path ?? photo.webPath ?? '');
      if (!blob) return;
      const formData = new FormData();
      formData.append('photos', blob, `photo-${Date.now()}.jpg`);
      this.galleryService.uploadFromGuest(formData).subscribe({
        next: () => this.loadFeed(true),
        error: () => alert('Error al subir la foto. Intentalo de nuevo.'),
      });
    } catch (err) {
      const msg = (err as { message?: string })?.message ?? '';
      if (msg.includes('cancel') || msg.includes('User cancelled')) {
        return;
      }
      const label = source === CameraSource.Camera ? 'la cámara' : 'la galería';
      alert(`No se pudo abrir ${label}. Revisá los permisos.`);
    }
  }

  private async fetchBlobFromCameraPath(path: string): Promise<Blob | null> {
    try {
      const url = Capacitor.convertFileSrc(path);
      const resp = await fetch(url);
      if (!resp.ok) return null;
      return await resp.blob();
    } catch {
      return null;
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const formData = new FormData();
    Array.from(input.files).forEach((file) => formData.append('photos', file));

    this.galleryService.uploadFromGuest(formData).subscribe({
      next: () => {
        input.value = '';
        this.loadFeed(true);
      },
      error: () => {
        input.value = '';
        alert('Error al subir la foto. Intentalo de nuevo.');
      },
    });
  }

  isNew(photo: FeedPhoto): boolean {
    const created = new Date(photo.createdAt).getTime();
    const now = Date.now();
    const diffMinutes = (now - created) / (1000 * 60);
    return diffMinutes <= 60;
  }
}
