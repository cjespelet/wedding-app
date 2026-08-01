import type { jsPDF } from 'jspdf';

export const WEDDING_PDF = {
  ink: [44, 36, 28] as const,
  muted: [92, 83, 72] as const,
  gold: [184, 150, 90] as const,
  ivory: [245, 240, 232] as const,
  white: [255, 255, 255] as const,
  margin: 14,
};

export function paintWeddingPdfBackground(doc: jsPDF): { pageWidth: number; pageHeight: number; centerX: number } {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const centerX = pageWidth / 2;
  const m = WEDDING_PDF.margin;

  doc.setFillColor(...WEDDING_PDF.ivory);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  doc.setDrawColor(...WEDDING_PDF.gold);
  doc.setLineWidth(0.6);
  doc.rect(m, m, pageWidth - m * 2, pageHeight - m * 2);

  doc.setLineWidth(0.25);
  doc.rect(m + 3, m + 3, pageWidth - (m + 3) * 2, pageHeight - (m + 3) * 2);

  return { pageWidth, pageHeight, centerX };
}

export function drawWeddingPdfHeader(
  doc: jsPDF,
  centerX: number,
  options: { eyebrow: string; coupleTitle: string; subtitle: string },
  startY = 28,
): number {
  doc.setTextColor(...WEDDING_PDF.muted);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(options.eyebrow.toUpperCase(), centerX, startY, { align: 'center', charSpace: 1.2 });

  doc.setTextColor(...WEDDING_PDF.ink);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(26);
  doc.text(options.coupleTitle, centerX, startY + 14, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(13);
  doc.setTextColor(...WEDDING_PDF.gold);
  doc.text(options.subtitle, centerX, startY + 24, { align: 'center' });

  doc.setDrawColor(...WEDDING_PDF.gold);
  doc.setLineWidth(0.4);
  const lineW = 42;
  doc.line(centerX - lineW / 2, startY + 28, centerX + lineW / 2, startY + 28);

  return startY + 36;
}
