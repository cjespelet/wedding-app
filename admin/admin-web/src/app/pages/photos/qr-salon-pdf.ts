const QR_SALON_INSTRUCTIONS = [
  '¿Sacaste fotos en la fiesta?',
  '',
  '1. Abrí la cámara de tu celular',
  '2. Escaneá este código QR',
  '3. Elegí tus fotos y tocá «Subir»',
  '',
  'No hace falta instalar la app ni registrarte.',
  'Tus fotos se suman a la galería de la boda.',
  '',
  '¡Gracias por compartir este momento con nosotros!',
];

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export async function downloadSalonQrPdf(options: {
  coupleTitle: string;
  qrImageUrl: string;
  fileName?: string;
}): Promise<void> {
  const { coupleTitle, qrImageUrl, fileName = 'qr-fotos-salon.pdf' } = options;

  const [{ jsPDF }, response] = await Promise.all([
    import('jspdf'),
    fetch(qrImageUrl),
  ]);

  if (!response.ok) {
    throw new Error('No se pudo cargar la imagen del QR');
  }

  const dataUrl = await blobToDataUrl(await response.blob());
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const centerX = pageWidth / 2;

  doc.setTextColor(44, 36, 28);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text('Galería de la fiesta', centerX, 24, { align: 'center' });

  doc.setFontSize(28);
  doc.text(coupleTitle, centerX, 38, { align: 'center' });

  const qrSize = 95;
  const qrY = 52;
  doc.addImage(dataUrl, 'PNG', (pageWidth - qrSize) / 2, qrY, qrSize, qrSize);

  doc.setFontSize(12);
  doc.setTextColor(92, 83, 72);
  const textY = qrY + qrSize + 18;
  const maxWidth = 140;
  const lines = QR_SALON_INSTRUCTIONS.flatMap((paragraph) => {
    if (!paragraph) {
      return [''];
    }
    return doc.splitTextToSize(paragraph, maxWidth);
  });

  doc.text(lines, centerX, textY, { align: 'center', maxWidth });

  doc.save(fileName);
}
