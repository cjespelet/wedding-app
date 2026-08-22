import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export type BarGlassType = 'highball' | 'collins' | 'coupe' | 'spritz' | 'rocks';

export interface BarDrink {
  id: string;
  name: string;
  description: string | null;
  glassType: BarGlassType;
  position: number;
}

export type BarDrinkPayload = {
  name: string;
  description?: string | null;
  glassType: BarGlassType;
};

export const BAR_GLASS_OPTIONS: { value: BarGlassType; label: string }[] = [
  { value: 'highball', label: 'Vaso largo' },
  { value: 'collins', label: 'Vaso Collins' },
  { value: 'coupe', label: 'Copa' },
  { value: 'spritz', label: 'Copa Spritz' },
  { value: 'rocks', label: 'Vaso bajo (rocks)' },
];

@Injectable({ providedIn: 'root' })
export class BarDrinksService {
  constructor(private http: HttpClient) {}

  list() {
    return this.http.get<BarDrink[]>(`${environment.apiBaseUrl}/bar-drinks`);
  }

  create(payload: BarDrinkPayload) {
    return this.http.post<BarDrink>(`${environment.apiBaseUrl}/bar-drinks`, payload);
  }

  update(id: string, payload: BarDrinkPayload) {
    return this.http.put<BarDrink>(`${environment.apiBaseUrl}/bar-drinks/${id}`, payload);
  }

  remove(id: string) {
    return this.http.delete<void>(`${environment.apiBaseUrl}/bar-drinks/${id}`);
  }

  reorder(ids: string[]) {
    return this.http.put<BarDrink[]>(`${environment.apiBaseUrl}/bar-drinks/reorder`, { ids });
  }
}
