import { Component, input, signal, computed, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-location-map',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './location-map.component.html',
  styleUrl: './location-map.component.scss',
})
export class LocationMapComponent {
  location = input.required<string>();
  apiKey = input<string>('');

  expanded = signal(false);

  private readonly sanitizer = inject(DomSanitizer);

  embedUrl = computed(() => {
    const key = this.apiKey();
    const q = this.location()?.trim();
    if (!key || !q) return null;
    const url = `https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(key)}&q=${encodeURIComponent(q)}`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  });

  showMap = computed(() => !!this.embedUrl());

  openExpand(): void {
    this.expanded.set(true);
  }

  closeExpand(): void {
    this.expanded.set(false);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.expanded()) this.closeExpand();
  }
}
