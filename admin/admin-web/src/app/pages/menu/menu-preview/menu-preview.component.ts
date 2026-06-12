import { Component, Input, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MenuStep } from '../../../core/services/menu.service';

@Component({
  standalone: true,
  selector: 'app-menu-preview',
  templateUrl: './menu-preview.component.html',
  styleUrls: ['./menu-preview.component.scss'],
  imports: [CommonModule, MatCardModule],
})
export class MenuPreviewComponent {
  @Input() steps: MenuStep[] = [];
  @ViewChild('printArea') printArea?: ElementRef<HTMLDivElement>;
  @Input() brideName: string | null | undefined;
  @Input() groomName: string | null | undefined;

  printPdf() {
    if (!this.printArea) return;
    const contents = this.printArea.nativeElement.innerHTML;
    const win = window.open('', '_blank', 'width=800,height=1000');
    if (!win) return;

    win.document.open();
    win.document.write(`
      <html>
        <head>
          <title>Menú del evento</title>
          <style>
            body {
              margin: 0;
              padding: 20px;
              font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            }
            .print-frame {
              border: 1px solid #000;
              padding: 20px;
              max-width: 700px;
              margin: 0 auto;
            }
            .menu-preview-header {
              text-align: center;
              margin-bottom: 16px;
            }
            .menu-preview-title-main {
              font-size: 22px;
              font-weight: 700;
              margin-bottom: 4px;
            }
            .menu-preview-subtitle {
              font-size: 14px;
              color: #777;
              margin-bottom: 4px;
            }
            .menu-preview-names {
              font-size: 16px;
              margin-bottom: 12px;
            }
            .menu-preview {
              display: flex;
              flex-direction: column;
              gap: 16px;
              margin-top: 8px;
            }
            .menu-preview-item {
              text-align: center;
              padding: 12px 8px;
              border-bottom: 1px dashed rgba(0, 0, 0, 0.2);
            }
            .menu-preview-item:last-child {
              border-bottom: none;
            }
            .menu-preview-time {
              font-weight: 700;
              font-size: 18px;
              margin-bottom: 4px;
            }
            .menu-preview-title {
              font-weight: 700;
              font-size: 16px;
              margin-bottom: 4px;
            }
            .menu-preview-description {
              font-size: 14px;
              color: #555;
            }
          </style>
        </head>
        <body>
          <div class="print-frame">
            <div class="menu-preview-header">
              <div class="menu-preview-title-main">Menú Boda</div>
              <div class="menu-preview-subtitle">Timeline gastronómico</div>
              ${(this.brideName || this.groomName)
                ? `<div class="menu-preview-names">${this.brideName ?? ''} &amp; ${this.groomName ?? ''}</div>`
                : ''
              }
            </div>
            ${contents}
          </div>
        </body>
      </html>
    `);
    win.document.close();
    win.focus();
    win.print();
  }
}

