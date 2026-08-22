import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { BarDrink, BarDrinksService, BarDrinkPayload } from '../../../core/services/bar-drinks.service';
import { BarDrinkFormComponent, BarDrinkFormValue } from '../bar-drink-form/bar-drink-form.component';
import { BarDrinkListComponent } from '../bar-drink-list/bar-drink-list.component';

@Component({
  standalone: true,
  selector: 'app-bar-drinks-manager',
  templateUrl: './bar-drinks-manager.page.html',
  styleUrls: ['./bar-drinks-manager.page.scss'],
  imports: [CommonModule, MatSnackBarModule, BarDrinkFormComponent, BarDrinkListComponent],
})
export class BarDrinksManagerPage implements OnInit {
  private readonly barDrinksService = inject(BarDrinksService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly cdRef = inject(ChangeDetectorRef);

  drinks: BarDrink[] = [];
  editingDrink: BarDrink | null = null;

  ngOnInit(): void {
    this.load();
  }

  load() {
    this.barDrinksService.list().subscribe({
      next: (list) => {
        this.drinks = list;
        this.cdRef.detectChanges();
      },
      error: () => this.snackBar.open('Error al cargar tragos', 'Cerrar', { duration: 3000 }),
    });
  }

  onSaveDrink(value: BarDrinkFormValue) {
    const payload: BarDrinkPayload = {
      name: value.name,
      description: value.description?.trim() || null,
      glassType: value.glassType,
    };

    if (value.id) {
      this.barDrinksService.update(value.id, payload).subscribe({
        next: () => {
          this.snackBar.open('Trago actualizado', 'Cerrar', { duration: 3000 });
          this.editingDrink = null;
          this.load();
        },
        error: () => this.snackBar.open('Error al actualizar trago', 'Cerrar', { duration: 3000 }),
      });
    } else {
      this.barDrinksService.create(payload).subscribe({
        next: () => {
          this.snackBar.open('Trago agregado', 'Cerrar', { duration: 3000 });
          this.load();
        },
        error: () => this.snackBar.open('Error al agregar trago', 'Cerrar', { duration: 3000 }),
      });
    }
  }

  onEdit(drink: BarDrink) {
    this.editingDrink = drink;
  }

  onCancelEdit() {
    this.editingDrink = null;
  }

  onDelete(drink: BarDrink) {
    if (!confirm(`¿Eliminar "${drink.name}" de la carta de barra?`)) return;
    this.barDrinksService.remove(drink.id).subscribe({
      next: () => {
        this.snackBar.open('Trago eliminado', 'Cerrar', { duration: 3000 });
        if (this.editingDrink?.id === drink.id) {
          this.editingDrink = null;
        }
        this.load();
      },
      error: () => this.snackBar.open('Error al eliminar trago', 'Cerrar', { duration: 3000 }),
    });
  }

  onReorder(newDrinks: BarDrink[]) {
    const ids = newDrinks.map((d) => d.id);
    this.barDrinksService.reorder(ids).subscribe({
      next: () => {
        this.snackBar.open('Orden actualizado', 'Cerrar', { duration: 2000 });
        this.load();
      },
      error: () => this.snackBar.open('Error al actualizar orden', 'Cerrar', { duration: 3000 }),
    });
  }
}
