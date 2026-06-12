import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { map, Observable } from 'rxjs';

export interface PhotoAuthor {
  id: string;
  username: string | null;
  fullName: string;
}

export interface FeedPhoto {
  id: string;
  weddingId: string;
  originalUrl: string;
  largeUrl: string;
  mediumUrl: string;
  squareUrl: string;
  highlighted?: boolean;
  approved?: boolean;
  createdAt: string;
  likes: number;
  likesCount: number;
  likedByMe: boolean;
  commentsCount: number;
  author: PhotoAuthor | null;
}

export interface PhotoFeedResponse {
  items: FeedPhoto[];
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface LikeToggleResponse {
  id: string;
  likes: number;
  likesCount: number;
  likedByMe: boolean;
}

export interface PhotoLikeUser {
  username: string | null;
  fullName: string;
}

export interface CommentItem {
  id: string;
  content: string;
  createdAt: string;
  author: PhotoAuthor;
  likesCount: number;
  likedByMe: boolean;
}

export interface CommentsResponse {
  items: CommentItem[];
  page: number;
  hasMore: boolean;
}

/** Foto legacy (grid / display) — sin feed social */
export interface Photo {
  id: string;
  originalUrl: string;
  largeUrl: string;
  mediumUrl: string;
  squareUrl: string;
  highlighted?: boolean;
  createdAt: string;
  likes?: number;
  uploadedBy?: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class GalleryService {
  constructor(private http: HttpClient) {}

  private withAbsoluteUrls(photos: Photo[]): Photo[] {
    const baseUrl = environment.apiBaseUrl.replace(/\/api\/?$/, '');
    return photos.map((p) => {
      const fix = (url: string) =>
        url && url.startsWith('/') ? `${baseUrl}${url}` : url;
      return {
        ...p,
        originalUrl: fix(p.originalUrl),
        largeUrl: fix(p.largeUrl),
        mediumUrl: fix(p.mediumUrl),
        squareUrl: fix(p.squareUrl),
      };
    });
  }

  private withAbsoluteFeed(items: FeedPhoto[]): FeedPhoto[] {
    const baseUrl = environment.apiBaseUrl.replace(/\/api\/?$/, '');
    const fix = (url: string) =>
      url && url.startsWith('/') ? `${baseUrl}${url}` : url;
    return items.map((p) => ({
      ...p,
      originalUrl: fix(p.originalUrl),
      largeUrl: fix(p.largeUrl),
      mediumUrl: fix(p.mediumUrl),
      squareUrl: fix(p.squareUrl),
    }));
  }

  /** Feed tipo Instagram (paginado) */
  /** Una foto por id (misma boda); URLs absolutas como el feed */
  getPhotoDetail(photoId: string): Observable<FeedPhoto> {
    return this.http
      .get<FeedPhoto>(`${environment.apiBaseUrl}/photos/detail/${encodeURIComponent(photoId)}`)
      .pipe(map((p) => this.withAbsoluteFeed([p])[0]));
  }

  getFeed(page = 0, limit = 15, mine = false, userId?: string): Observable<PhotoFeedResponse> {
    let params = new HttpParams().set('page', String(page)).set('limit', String(limit));
    if (mine) {
      params = params.set('mine', '1');
    } else if (userId) {
      params = params.set('userId', userId);
    }
    return this.http
      .get<PhotoFeedResponse>(`${environment.apiBaseUrl}/photos`, { params })
      .pipe(map((r) => ({ ...r, items: this.withAbsoluteFeed(r.items) })));
  }

  toggleLikePhoto(photoId: string): Observable<LikeToggleResponse> {
    return this.http.post<LikeToggleResponse>(
      `${environment.apiBaseUrl}/photos/${encodeURIComponent(photoId)}/like`,
      {},
    );
  }

  getPhotoLikes(photoId: string): Observable<{ users: PhotoLikeUser[] }> {
    return this.http.get<{ users: PhotoLikeUser[] }>(
      `${environment.apiBaseUrl}/photos/${encodeURIComponent(photoId)}/likes`,
    );
  }

  getComments(photoId: string, page = 0): Observable<CommentsResponse> {
    const params = new HttpParams().set('page', String(page)).set('limit', '30');
    return this.http.get<CommentsResponse>(
      `${environment.apiBaseUrl}/photos/${encodeURIComponent(photoId)}/comments`,
      { params },
    );
  }

  postComment(photoId: string, content: string): Observable<CommentItem> {
    return this.http.post<CommentItem>(`${environment.apiBaseUrl}/comments`, {
      photoId,
      content,
    });
  }

  toggleCommentLike(commentId: string): Observable<{ id: string; likesCount: number; likedByMe: boolean }> {
    return this.http.post<{ id: string; likesCount: number; likedByMe: boolean }>(
      `${environment.apiBaseUrl}/comments/${encodeURIComponent(commentId)}/like`,
      {},
    );
  }

  /** Lista simple (compat) */
  list(): Observable<Photo[]> {
    return this.http
      .get<Photo[]>(`${environment.apiBaseUrl}/gallery`)
      .pipe(map((photos) => this.withAbsoluteUrls(photos)));
  }

  uploadFromGuest(formData: FormData): Observable<Photo[]> {
    return this.http
      .post<Photo[]>(`${environment.apiBaseUrl}/gallery/upload-guest`, formData)
      .pipe(map((photos) => this.withAbsoluteUrls(photos)));
  }

  uploadImage(formData: FormData): Observable<{ url: string }> {
    return this.http.post<{ url: string }>(`${environment.apiBaseUrl}/upload`, formData);
  }

  uploadImagesMultiple(formData: FormData): Observable<{ urls: string[] }> {
    return this.http.post<{ urls: string[] }>(`${environment.apiBaseUrl}/upload/multiple`, formData);
  }

  registerShare(photoId?: string) {
    return this.http.post<{ ok: boolean; remaining: number }>(`${environment.apiBaseUrl}/gallery/share`, {
      photoId,
    });
  }

  checkShareStatus() {
    return this.http.get<{ ok: boolean; remaining: number }>(`${environment.apiBaseUrl}/gallery/share-status`);
  }

  /** @deprecated usar toggleLikePhoto */
  likePhoto(photoId: string) {
    return this.toggleLikePhoto(photoId);
  }

  listPublicByWedding(weddingId: string): Observable<Photo[]> {
    return this.http
      .get<Photo[]>(`${environment.apiBaseUrl}/gallery/${encodeURIComponent(weddingId)}`)
      .pipe(map((photos) => this.withAbsoluteUrls(photos)));
  }
}
