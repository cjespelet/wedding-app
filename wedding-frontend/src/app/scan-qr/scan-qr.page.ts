import { Component, OnDestroy, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { CheckinService } from '../services/checkin.service';
import { BrowserMultiFormatReader } from '@zxing/library';

@Component({
  standalone: true,
  selector: 'app-scan-qr',
  templateUrl: './scan-qr.page.html',
  styleUrls: ['./scan-qr.page.scss'],
  imports: [CommonModule, IonicModule],
})
export class ScanQrPage implements AfterViewInit, OnDestroy {
  @ViewChild('video') videoRef!: ElementRef<HTMLVideoElement>;

  error: string | null = null;
  scanning = true;
  permissionDenied = false;
  private reader: BrowserMultiFormatReader | null = null;
  private stream: MediaStream | null = null;

  constructor(
    private router: Router,
    private checkinService: CheckinService,
  ) {}

  ngAfterViewInit(): void {
    this.startScan();
  }

  ngOnDestroy(): void {
    this.stopScan();
  }

  private startScan(): void {
    // Reseteo de estado para reintentos por permisos en iOS/Safari.
    this.permissionDenied = false;
    this.error = null;
    this.scanning = true;

    this.reader = new BrowserMultiFormatReader();
    this.reader
      .decodeFromVideoDevice(null, this.videoRef.nativeElement, (result) => {
        if (result) {
          const code = result.getText();
          this.onCodeScanned(code);
        }
      })
      .then(() => {
        this.stream = this.videoRef?.nativeElement?.srcObject as MediaStream | null;
        this.error = null;
      })
      .catch((err) => {
        this.stopScan();

        const isPermissionError = this.isCameraPermissionError(err);
        this.permissionDenied = isPermissionError;

        this.error = isPermissionError
          ? 'No se pudo acceder a la cámara. Revisá los permisos de Cámara en iPhone (Safari) y volvé a intentar.'
          : 'No se pudo acceder a la cámara. Revisá los permisos del navegador.';

        this.scanning = false;
        console.error(err);
      });
  }

  private isCameraPermissionError(err: unknown): boolean {
    const anyErr = err as any;
    const name = (anyErr?.name ?? '').toString();
    const message = (anyErr?.message ?? '').toString().toLowerCase();

    return (
      name === 'NotAllowedError' ||
      name === 'SecurityError' ||
      name === 'NotReadableError' ||
      message.includes('permission') ||
      message.includes('notallowed') ||
      message.includes('denied')
      || message.includes('blocked')
      || message.includes('could not start camera')
      || message.includes('failed to start camera')
      || message.includes('could not start video')
    );
  }

  private stopScan(): void {
    const stream = this.stream ?? this.videoRef?.nativeElement?.srcObject as MediaStream | null;
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
    }
    this.stream = null;
    this.reader = null;
  }

  requestPermissionAgain(): void {
    // Reintento con un click del usuario (en iOS Safari es clave para que dispare prompt).
    this.startScan();
  }

  private onCodeScanned(code: string): void {
    if (!code?.trim()) return;
    this.stopScan();
    this.scanning = false;

    this.checkinService.checkinFromQr(code.trim()).subscribe({
      next: (res) => {
        if (res.alreadyCheckedIn) {
          alert('Tu ingreso ya estaba registrado. ¡Disfrutá de la fiesta!');
        } else {
          alert('Ingreso registrado. ¡Bienvenido a la fiesta!');
        }
        this.router.navigateByUrl('/dashboard/dashboard?justCheckedIn=1', { replaceUrl: true });
      },
      error: () => {
        alert('No pudimos registrar tu ingreso. Intentalo de nuevo o consultá en recepción.');
        this.scanning = true;
        this.startScan();
      },
    });
  }

  cancel(): void {
    this.router.navigateByUrl('/dashboard/dashboard');
  }
}
