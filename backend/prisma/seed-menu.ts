import { PrismaClient } from '@prisma/client';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const prisma = new PrismaClient();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const defaultCsvPath = path.join(__dirname, 'data', 'menu-steps.csv');

type MenuStepRow = {
  time: string;
  title: string;
  description: string;
  position: number;
};

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      fields.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  fields.push(current);
  return fields;
}

function loadMenuStepsFromCsv(csvPath: string): MenuStepRow[] {
  const content = fs.readFileSync(csvPath, 'utf8').trim();
  const lines = content.split(/\r?\n/).filter(Boolean);

  if (lines.length < 2) {
    throw new Error(`CSV vacío o sin filas de datos: ${csvPath}`);
  }

  const header = parseCsvLine(lines[0]).map((h) => h.trim());
  const timeIdx = header.indexOf('time');
  const titleIdx = header.indexOf('title');
  const descriptionIdx = header.indexOf('description');
  const positionIdx = header.indexOf('position');

  if ([timeIdx, titleIdx, descriptionIdx, positionIdx].some((idx) => idx === -1)) {
    throw new Error('CSV inválido: faltan columnas time, title, description o position');
  }

  return lines.slice(1).map((line, index) => {
    const cols = parseCsvLine(line);
    const position = Number.parseInt(cols[positionIdx]?.trim() ?? '', 10);

    if (!cols[timeIdx]?.trim() || !cols[titleIdx]?.trim() || !cols[descriptionIdx]?.trim()) {
      throw new Error(`Fila ${index + 2} incompleta en ${csvPath}`);
    }
    if (!Number.isFinite(position)) {
      throw new Error(`Fila ${index + 2}: position inválido`);
    }

    return {
      time: cols[timeIdx].trim(),
      title: cols[titleIdx].trim(),
      description: cols[descriptionIdx].trim(),
      position,
    };
  });
}

async function main() {
  const csvArg = process.argv.find((arg) => arg.endsWith('.csv'));
  const csvPath = csvArg ? path.resolve(csvArg) : defaultCsvPath;
  const weddingSlug = process.env.WEDDING_SLUG ?? 'demo-wedding';
  const replaceExisting = process.env.REPLACE_EXISTING !== 'false';

  if (!fs.existsSync(csvPath)) {
    throw new Error(`No se encontró el CSV: ${csvPath}`);
  }

  const wedding = await prisma.wedding.findUnique({ where: { slug: weddingSlug } });
  if (!wedding) {
    throw new Error(`No existe boda con slug "${weddingSlug}"`);
  }

  const rows = loadMenuStepsFromCsv(csvPath).sort((a, b) => a.position - b.position);

  if (replaceExisting) {
    const deleted = await prisma.menuStep.deleteMany({ where: { weddingId: wedding.id } });
    console.log(`Eliminados ${deleted.count} pasos de menú previos.`);
  }

  const created = await prisma.menuStep.createMany({
    data: rows.map((row) => ({
      weddingId: wedding.id,
      time: row.time,
      title: row.title,
      description: row.description,
      position: row.position,
    })),
  });

  console.log(`Importados ${created.count} pasos de menú para "${weddingSlug}" (${wedding.brideName} & ${wedding.groomName}).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
