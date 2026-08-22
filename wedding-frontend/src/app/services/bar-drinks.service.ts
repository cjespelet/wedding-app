import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

export type BarGlassType = 'highball' | 'collins' | 'coupe' | 'spritz' | 'rocks';

export interface BarDrink {
  id: string;
  name: string;
  description: string | null;
  glassType: BarGlassType;
}

@Injectable({
  providedIn: 'root',
})
export class BarDrinksService {
  constructor(private http: HttpClient) {}

  list(): Observable<BarDrink[]> {
    return this.http.get<BarDrink[]>(`${environment.apiBaseUrl}/bar-drinks`);
  }
}
