import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MenuStep } from '../../../core/services/menu.service';

export interface MenuFormValue {
  id?: string;
  time: string;
  title: string;
  description: string;
}

@Component({
  standalone: true,
  selector: 'app-menu-form',
  templateUrl: './menu-form.component.html',
  styleUrls: ['./menu-form.component.scss'],
  imports: [CommonModule, ReactiveFormsModule],
})
export class MenuFormComponent implements OnChanges {
  @Input() editingStep: MenuStep | null = null;
  @Output() saveStep = new EventEmitter<MenuFormValue>();

  form: FormGroup;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      time: ['', Validators.required],
      title: ['', Validators.required],
      description: ['', Validators.required],
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['editingStep'] && this.editingStep) {
      this.form.setValue({
        time: this.editingStep.time,
        title: this.editingStep.title,
        description: this.editingStep.description,
      });
    }
  }

  submit() {
    if (this.form.invalid) return;
    const value = this.form.value as Omit<MenuFormValue, 'id'>;
    const payload: MenuFormValue = this.editingStep ? { id: this.editingStep.id, ...value } : value;
    this.saveStep.emit(payload);
  }

  reset() {
    this.form.reset({
      time: '',
      title: '',
      description: '',
    });
  }
}

