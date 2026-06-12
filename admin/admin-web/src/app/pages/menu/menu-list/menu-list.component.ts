import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDrag, CdkDropList, CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MenuStep } from '../../../core/services/menu.service';

@Component({
  standalone: true,
  selector: 'app-menu-list',
  templateUrl: './menu-list.component.html',
  styleUrls: ['./menu-list.component.scss'],
  imports: [CommonModule, DragDropModule, MatIconModule, MatButtonModule, CdkDropList, CdkDrag],
})
export class MenuListComponent {
  @Input() steps: MenuStep[] = [];
  @Output() editStep = new EventEmitter<MenuStep>();
  @Output() deleteStep = new EventEmitter<MenuStep>();
  @Output() reorderSteps = new EventEmitter<MenuStep[]>();

  drop(event: CdkDragDrop<MenuStep[]>) {
    if (!this.steps || this.steps.length === 0) return;
    const newSteps = [...this.steps];
    moveItemInArray(newSteps, event.previousIndex, event.currentIndex);
    this.reorderSteps.emit(newSteps);
  }
}

