import { Component, Input } from '@angular/core';
import {
  BadgePercent,
  Beer,
  Citrus,
  Coffee,
  CupSoda,
  Flame,
  GlassWater,
  Leaf,
  Martini,
  Snowflake,
  Sparkles,
  Star,
  Wine,
  type IconNode,
} from 'lucide';
import { BarDrinkLucideIconName } from './bar-drink-icons';

const ICON_MAP: Record<BarDrinkLucideIconName, IconNode> = {
  martini: Martini,
  beer: Beer,
  wine: Wine,
  'glass-water': GlassWater,
  'cup-soda': CupSoda,
  coffee: Coffee,
  citrus: Citrus,
  snowflake: Snowflake,
  leaf: Leaf,
  star: Star,
  flame: Flame,
  sparkles: Sparkles,
  'badge-percent': BadgePercent,
};

@Component({
  standalone: true,
  selector: 'app-bar-drink-icon',
  templateUrl: './bar-drink-icon.component.html',
  styleUrls: ['./bar-drink-icon.component.scss'],
})
export class BarDrinkIconComponent {
  @Input({ required: true }) name: BarDrinkLucideIconName = 'glass-water';
  @Input() size = 20;

  get nodes(): IconNode {
    return ICON_MAP[this.name] ?? GlassWater;
  }
}
