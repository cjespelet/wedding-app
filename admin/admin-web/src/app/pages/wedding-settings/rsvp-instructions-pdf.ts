import { WEDDING_PDF, drawWeddingPdfHeader, paintWeddingPdfBackground } from './wedding-pdf-theme';

type RsvpStep = {
  title: string;
  lines: string[];
};

function buildSteps(invitationUrl: string, appUrl: string): RsvpStep[] {
  return [
    {
      title: 'Entrá a la invitación y tocá «Confirmar asistencia»',
      lines: [
        'Abrí la tarjeta digital de la boda en tu celular:',
        invitationUrl,
        'Deslizá hasta la sección de confirmación y tocá el botón CONFIRMAR ASISTENCIA.',
        'Si recibiste un link personalizado con tu invitación, usá ese (así queda asociado a tu grupo).',
      ],
    },
    {
      title: 'Registrate con usuario y contraseña',
      lines: [
        'Completá el formulario de registro:',
        '• Usuario: elegí un nombre corto que recuerdes (es lo que vas a usar para ingresar).',
        '• Contraseña: una clave personal que no olvides.',
        'Guardá estos datos: los vas a necesitar cada vez que entres a la app.',
        appUrl,
      ],
    },
    {
      title: 'Confirmá tu presencia desde la app',
      lines: [
        'Una vez dentro de la app, tocá el botón Confirmar presencia.',
        'Indicá si vas a asistir y cuántas personas de tu invitación confirman.',
        '¡Listo! Nos ayuda muchísimo saber quién viene.',
      ],
    },
  ];
}

function drawStepCard(
  doc: import('jspdf').jsPDF,
  pageWidth: number,
  y: number,
  stepNumber: number,
  step: RsvpStep,
): number {
  const cardX = 22;
  const cardW = pageWidth - 44;
  const padding = 6;
  const innerW = cardW - padding * 2 - 10;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);

  const titleLines = doc.splitTextToSize(step.title, innerW);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  const bodyLineCount = step.lines.reduce((count, line) => {
    if (!line) {
      return count + 1;
    }
    const isUrl = line.startsWith('http');
    doc.setFontSize(isUrl ? 9.5 : 11);
    return count + doc.splitTextToSize(line, innerW).length;
  }, 0);

  const cardH = 10 + titleLines.length * 5.5 + 3 + bodyLineCount * 5 + 8;

  doc.setFillColor(...WEDDING_PDF.white);
  doc.setDrawColor(...WEDDING_PDF.gold);
  doc.setLineWidth(0.25);
  doc.roundedRect(cardX, y, cardW, cardH, 2.5, 2.5, 'FD');

  doc.setFillColor(...WEDDING_PDF.gold);
  doc.circle(cardX + 8, y + 9, 5.5, 'F');
  doc.setTextColor(...WEDDING_PDF.white);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(String(stepNumber), cardX + 8, y + 10.2, { align: 'center' });

  let textY = y + 10;
  doc.setTextColor(...WEDDING_PDF.ink);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11.5);
  doc.text(titleLines, cardX + padding + 10, textY);

  textY += titleLines.length * 5.5 + 3;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(...WEDDING_PDF.muted);

  for (const line of step.lines) {
    if (!line) {
      textY += 3;
      continue;
    }
    const isUrl = line.startsWith('http');
    doc.setFont('helvetica', isUrl ? 'bold' : 'normal');
    doc.setFontSize(isUrl ? 9.5 : 11);
    if (isUrl) {
      doc.setTextColor(WEDDING_PDF.ink[0], WEDDING_PDF.ink[1], WEDDING_PDF.ink[2]);
    } else {
      doc.setTextColor(WEDDING_PDF.muted[0], WEDDING_PDF.muted[1], WEDDING_PDF.muted[2]);
    }
    const wrapped = doc.splitTextToSize(line, innerW);
    doc.text(wrapped, cardX + padding + 10, textY);
    textY += wrapped.length * 5 + (isUrl ? 2 : 1);
  }

  return y + cardH + 7;
}

export async function downloadRsvpInstructionsPdf(options: {
  coupleTitle: string;
  invitationUrl: string;
  appUrl?: string;
  fileName?: string;
}): Promise<void> {
  const {
    coupleTitle,
    invitationUrl,
    appUrl = 'https://jesiyjavier.com.ar',
    fileName = 'como-confirmar-asistencia.pdf',
  } = options;

  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const { pageWidth, pageHeight, centerX } = paintWeddingPdfBackground(doc);

  let y = drawWeddingPdfHeader(doc, centerX, {
    eyebrow: 'Invitación digital',
    coupleTitle,
    subtitle: 'Cómo confirmar tu asistencia',
  });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11.5);
  doc.setTextColor(...WEDDING_PDF.muted);
  const intro =
    'Seguí estos 3 pasos desde el celular. No hace falta instalar nada: la invitación y la app funcionan en el navegador.';
  const introLines = doc.splitTextToSize(intro, pageWidth - 50);
  doc.text(introLines, centerX, y, { align: 'center', maxWidth: pageWidth - 50 });
  y += introLines.length * 5.5 + 8;

  for (const [index, step] of buildSteps(invitationUrl, appUrl).entries()) {
    y = drawStepCard(doc, pageWidth, y, index + 1, step);
  }

  const footerY = pageHeight - 22;
  doc.setDrawColor(...WEDDING_PDF.gold);
  doc.setLineWidth(0.3);
  doc.line(30, footerY - 6, pageWidth - 30, footerY - 6);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(10);
  doc.setTextColor(...WEDDING_PDF.muted);
  doc.text('Guardá tu usuario y contraseña en un lugar seguro.', centerX, footerY, { align: 'center' });
  doc.text('¡Gracias por confirmar! Nos ayuda a organizar una fiesta inolvidable.', centerX, footerY + 5, {
    align: 'center',
  });

  doc.save(fileName);
}
