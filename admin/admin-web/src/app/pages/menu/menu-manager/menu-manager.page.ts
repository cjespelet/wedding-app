import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MenuService, MenuStep, MenuStepPayload } from '../../../core/services/menu.service';
import { WeddingService, WeddingInfo } from '../../../core/services/wedding.service';
import { MenuFormComponent, MenuFormValue } from '../menu-form/menu-form.component';
import { MenuListComponent } from '../menu-list/menu-list.component';
import { MenuPreviewComponent } from '../menu-preview/menu-preview.component';

@Component({
  standalone: true,
  selector: 'app-menu-manager',
  templateUrl: './menu-manager.page.html',
  styleUrls: ['./menu-manager.page.scss'],
  imports: [CommonModule, MatSnackBarModule, MenuFormComponent, MenuListComponent, MenuPreviewComponent],
})
export class MenuManagerPage implements OnInit {
  private readonly menuService = inject(MenuService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly cdRef = inject(ChangeDetectorRef);
  private readonly weddingService = inject(WeddingService);

  steps: MenuStep[] = [];
  editingStep: MenuStep | null = null;
  wedding: WeddingInfo | null = null;

  ngOnInit(): void {
    this.weddingService.getWedding().subscribe((w) => {
      this.wedding = w;
      this.cdRef.detectChanges();
    });
    this.load();
  }

  private sortSteps(list: MenuStep[]): MenuStep[] {
    // El orden ahora lo maneja drag & drop; esta función queda por si queremos
    // ordenar por hora en algún momento concreto.
    return [...list];
  }

  load() {
    this.menuService.list().subscribe({
      next: (list) => {
        this.steps = this.sortSteps(list);
        this.cdRef.detectChanges();
      },
      error: () => {
        this.snackBar.open('Error al cargar menú', 'Cerrar', { duration: 3000 });
      },
    });
  }

  onSaveStep(value: MenuFormValue) {
    const payload: MenuStepPayload = {
      time: value.time,
      title: value.title,
      description: value.description,
    };

    if (value.id) {
      this.menuService.update(value.id, payload).subscribe({
        next: () => {
          this.snackBar.open('Paso actualizado', 'Cerrar', { duration: 3000 });
          this.editingStep = null;
          this.load();
        },
        error: () => this.snackBar.open('Error al actualizar paso', 'Cerrar', { duration: 3000 }),
      });
    } else {
      this.menuService.create(payload).subscribe({
        next: () => {
          this.snackBar.open('Paso agregado', 'Cerrar', { duration: 3000 });
          this.load();
        },
        error: () => this.snackBar.open('Error al agregar paso', 'Cerrar', { duration: 3000 }),
      });
    }
  }

  onEdit(step: MenuStep) {
    this.editingStep = step;
  }

  onDelete(step: MenuStep) {
    if (!confirm('¿Eliminar este paso del menú?')) return;
    this.menuService.remove(step.id).subscribe({
      next: () => {
        this.snackBar.open('Paso eliminado', 'Cerrar', { duration: 3000 });
        this.load();
      },
      error: () => this.snackBar.open('Error al eliminar paso', 'Cerrar', { duration: 3000 }),
    });
  }

  onReorder(newSteps: MenuStep[]) {
    const ids = newSteps.map((s) => s.id);
    this.menuService.reorder(ids).subscribe({
      next: () => {
        this.snackBar.open('Orden actualizado', 'Cerrar', { duration: 2000 });
        this.load();
      },
      error: () => {
        this.snackBar.open('Error al actualizar orden', 'Cerrar', { duration: 3000 });
      },
    });
  }
}

