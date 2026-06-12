import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { MenuService, MenuStep } from '../services/menu.service';

@Component({
  standalone: true,
  selector: 'app-menu',
  templateUrl: './menu.page.html',
  styleUrls: ['./menu.page.scss'],
  imports: [CommonModule, IonicModule],
})
export class MenuPage implements OnInit {
  steps: MenuStep[] = [];
  loading = false;

  constructor(private menuService: MenuService) {}

  ngOnInit() {
    this.load();
  }

  load(event?: any) {
    this.loading = !event;
    this.menuService.list().subscribe({
      next: (list) => {
        this.steps = list;
        this.loading = false;
        event?.target.complete();
      },
      error: () => {
        this.loading = false;
        event?.target.complete();
      },
    });
  }
}

