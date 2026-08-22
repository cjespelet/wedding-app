import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { BAR_GLASS_OPTIONS, BarDrink, BarGlassType } from '../../../core/services/bar-drinks.service';

export interface BarDrinkFormValue {
  id?: string;
  name: string;
  description: string;
  glassType: BarGlassType;
}

@Component({
  standalone: true,
  selector: 'app-bar-drink-form',
  templateUrl: './bar-drink-form.component.html',
  styleUrls: ['./bar-drink-form.component.scss'],
  imports: [CommonModule, ReactiveFormsModule],
})
export class BarDrinkFormComponent implements OnChanges {
  @Input() editingDrink: BarDrink | null = null;
  @Output() saveDrink = new EventEmitter<BarDrinkFormValue>();
  @Output() cancelEdit = new EventEmitter<void>();

  glassOptions = BAR_GLASS_OPTIONS;
  form: FormGroup;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      glassType: ['highball', Validators.required],
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['editingDrink']) {
      if (this.editingDrink) {
        this.form.setValue({
          name: this.editingDrink.name,
          description: this.editingDrink.description ?? '',
          glassType: this.editingDrink.glassType,
        });
      } else {
        this.reset();
      }
    }
  }

  submit() {
    if (this.form.invalid) return;
    const value = this.form.value as Omit<BarDrinkFormValue, 'id'>;
    const payload: BarDrinkFormValue = this.editingDrink ? { id: this.editingDrink.id, ...value } : value;
    this.saveDrink.emit(payload);
    if (!this.editingDrink) {
      this.reset();
    }
  }

  onCancel() {
    this.reset();
    this.cancelEdit.emit();
  }

  reset() {
    this.form.reset({
      name: '',
      description: '',
      glassType: 'highball',
    });
  }
}
