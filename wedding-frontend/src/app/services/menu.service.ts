import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

export interface MenuStep {
  id: string;
  time: string;
  title: string;
  description: string;
}

@Injectable({
  providedIn: 'root',
})
export class MenuService {
  constructor(private http: HttpClient) {}

  list(): Observable<MenuStep[]> {
    return this.http.get<MenuStep[]>(`${environment.apiBaseUrl}/menu`);
  }
}

