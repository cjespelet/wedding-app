import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDrag, CdkDragDrop, CdkDropList, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { BAR_GLASS_OPTIONS, BarDrink } from '../../../core/services/bar-drinks.service';

@Component({
  standalone: true,
  selector: 'app-bar-drink-list',
  templateUrl: './bar-drink-list.component.html',
  styleUrls: ['./bar-drink-list.component.scss'],
  imports: [CommonModule, DragDropModule, CdkDropList, CdkDrag],
})
export class BarDrinkListComponent {
  @Input() drinks: BarDrink[] = [];
  @Output() editDrink = new EventEmitter<BarDrink>();
  @Output() deleteDrink = new EventEmitter<BarDrink>();
  @Output() reorderDrinks = new EventEmitter<BarDrink[]>();

  glassLabel(type: string): string {
    return BAR_GLASS_OPTIONS.find((o) => o.value === type)?.label ?? type;
  }

  drop(event: CdkDragDrop<BarDrink[]>) {
    if (!this.drinks.length) return;
    const reordered = [...this.drinks];
    moveItemInArray(reordered, event.previousIndex, event.currentIndex);
    this.reorderDrinks.emit(reordered);
  }
}
