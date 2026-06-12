import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface MenuStep {
  id: string;
  time: string;
  title: string;
  description: string;
}

export type MenuStepPayload = Omit<MenuStep, 'id'>;

@Injectable({
  providedIn: 'root',
})
export class MenuService {
  constructor(private http: HttpClient) {}

  list() {
    return this.http.get<MenuStep[]>(`${environment.apiBaseUrl}/menu`);
  }

  create(payload: MenuStepPayload) {
    return this.http.post<MenuStep>(`${environment.apiBaseUrl}/menu`, payload);
  }

  update(id: string, payload: MenuStepPayload) {
    return this.http.put<MenuStep>(`${environment.apiBaseUrl}/menu/${id}`, payload);
  }

  remove(id: string) {
    return this.http.delete<void>(`${environment.apiBaseUrl}/menu/${id}`);
  }

  reorder(ids: string[]) {
    return this.http.put<MenuStep[]>(`${environment.apiBaseUrl}/menu/reorder`, { ids });
  }
}

