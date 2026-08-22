import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { BarDrink, BarDrinksService } from '../services/bar-drinks.service';
import {
  BarDrinkLucideIconName,
  resolveDrinkBadges,
  resolveDrinkIconName,
  resolveIngredientIcons,
} from './bar-drink-icons';
import { BarDrinkIconComponent } from './bar-drink-icon.component';

@Component({
  standalone: true,
  selector: 'app-bar',
  templateUrl: './bar.page.html',
  styleUrls: ['./bar.page.scss'],
  imports: [CommonModule, IonicModule, BarDrinkIconComponent],
})
export class BarPage implements OnInit {
  drinks: BarDrink[] = [];
  loading = false;
  loadError = false;
  readonly iconSize = 20;
  readonly smallIconSize = 18;

  constructor(private barDrinksService: BarDrinksService) {}

  ngOnInit() {
    this.load();
  }

  load(event?: any) {
    this.loading = !event;
    this.loadError = false;
    this.barDrinksService.list().subscribe({
      next: (list) => {
        this.drinks = list;
        this.loading = false;
        this.loadError = false;
        event?.target.complete();
      },
      error: () => {
        this.drinks = [];
        this.loading = false;
        this.loadError = true;
        event?.target.complete();
      },
    });
  }

  drinkIcon(drink: BarDrink): BarDrinkLucideIconName {
    return resolveDrinkIconName(drink.name, drink.glassType);
  }

  drinkBadges(drink: BarDrink): BarDrinkLucideIconName[] {
    return resolveDrinkBadges(drink.name, drink.description ?? '');
  }

  ingredientIcons(description: string | null): BarDrinkLucideIconName[] {
    if (!description) return [];
    return resolveIngredientIcons(description);
  }
}
