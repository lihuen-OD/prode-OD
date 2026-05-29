import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import XLSX from 'xlsx';
import { prisma } from '../src/config/prisma.js';
import { AppError } from '../src/utils/AppError.js';
import { createParticipantUser } from '../src/modules/users/users.service.js';

const REQUIRED_HEADERS = ['APELLIDO', 'NOMBRE', 'DNI'] as const;
const workbookPath = path.resolve(process.cwd(), 'data', 'NOMINA PRODE.xlsx');
const dryRun = process.argv.includes('--dry-run') || process.env.IMPORT_USERS_DRY_RUN === '1';
const excelOnly = process.argv.includes('--excel-only') || process.env.IMPORT_USERS_EXCEL_ONLY === '1';
const resetBeforeImport = process.argv.includes('--reset') || process.env.IMPORT_USERS_RESET === '1';

type RowData = {
  apellido: string;
  nombre: string;
  dni: string;
  rowNumber: number;
};

type DuplicateEntry = {
  rowNumber: number;
  fullName: string;
  dni: string;
  username: string;
  reason: string;
};

type ValidEntry = {
  rowNumber: number;
  fullName: string;
  dni: string;
  username: string;
};

function normalizeCell(value: unknown) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function normalizeForUsername(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ñ/gi, 'n')
    .replace(/[’'`]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function firstToken(value: string) {
  return normalizeForUsername(value).split(' ').filter(Boolean)[0] ?? '';
}

function firstTwoTokens(value: string) {
  const tokens = normalizeForUsername(value).split(' ').filter(Boolean);
  return tokens.slice(0, 2).join('-');
}

function buildUsername(nombre: string, apellido: string) {
  const normalizedNombre = firstTwoTokens(nombre) || firstToken(nombre);
  const normalizedApellido = firstToken(apellido);

  if (!normalizedNombre || !normalizedApellido) {
    return '';
  }

  return `${normalizedNombre}.${normalizedApellido}`;
}

function buildFullName(nombre: string, apellido: string) {
  return `${normalizeCell(nombre)} ${normalizeCell(apellido)}`.replace(/\s+/g, ' ').trim();
}

function getWorkbookRows() {
  const workbook = XLSX.readFile(workbookPath, {
    cellDates: false,
    cellFormula: false,
    cellText: false,
  });

  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error('El Excel no contiene hojas.');
  }

  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: '',
    raw: false,
  });

  if (rows.length === 0) {
    throw new Error('El Excel no contiene filas.');
  }

  const headerRowIndex = rows.findIndex(row => row.some(cell => normalizeCell(cell).length > 0));
  if (headerRowIndex === -1) {
    throw new Error('No se encontró una fila de encabezados válida.');
  }

  const headers = rows[headerRowIndex].map(cell => normalizeCell(cell).toUpperCase());
  for (const requiredHeader of REQUIRED_HEADERS) {
    if (!headers.includes(requiredHeader)) {
      throw new Error(`Falta la columna requerida ${requiredHeader} en el Excel.`);
    }
  }

  const apellidoIndex = headers.indexOf('APELLIDO');
  const nombreIndex = headers.indexOf('NOMBRE');
  const dniIndex = headers.indexOf('DNI');

  const dataRows: RowData[] = [];
  for (let rowIndex = headerRowIndex + 1; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex];
    const rowNumber = rowIndex + 1;
    const apellido = normalizeCell(row[apellidoIndex]);
    const nombre = normalizeCell(row[nombreIndex]);
    const dni = normalizeCell(row[dniIndex]);

    if (!apellido && !nombre && !dni) {
      continue;
    }

    dataRows.push({ apellido, nombre, dni, rowNumber });
  }

  return dataRows;
}

async function main() {
  await fs.access(workbookPath);

  if (resetBeforeImport && !dryRun && !excelOnly) {
    const deletedUsers = await prisma.user.deleteMany({ where: { role: 'USER' } });
    console.log(`🧹 Usuarios eliminados antes de importar: ${deletedUsers.count}`);
  }

  const rows = getWorkbookRows();
  const createdUsers: string[] = [];
  const omittedDuplicates: DuplicateEntry[] = [];
  const rowErrors: Array<{ rowNumber: number; reason: string }> = [];
  const entriesByDni = new Map<string, ValidEntry[]>();
  const uniqueEntriesByDni = new Map<string, ValidEntry>();

  for (const row of rows) {
    if (!row.nombre) {
      rowErrors.push({ rowNumber: row.rowNumber, reason: 'Falta NOMBRE.' });
      continue;
    }

    if (!row.apellido) {
      rowErrors.push({ rowNumber: row.rowNumber, reason: 'Falta APELLIDO.' });
      continue;
    }

    if (!row.dni) {
      rowErrors.push({ rowNumber: row.rowNumber, reason: 'Falta DNI.' });
      continue;
    }

    const fullName = buildFullName(row.nombre, row.apellido);
    const username = buildUsername(row.nombre, row.apellido);

    if (!username) {
      rowErrors.push({ rowNumber: row.rowNumber, reason: 'No se pudo generar el username.' });
      continue;
    }

    const entry = { rowNumber: row.rowNumber, fullName, dni: row.dni, username };
    const currentEntries = entriesByDni.get(row.dni) ?? [];
    currentEntries.push(entry);
    entriesByDni.set(row.dni, currentEntries);

    if (!uniqueEntriesByDni.has(row.dni)) {
      uniqueEntriesByDni.set(row.dni, entry);
    }
  }

  for (const entries of entriesByDni.values()) {
    for (let index = 1; index < entries.length; index += 1) {
      const duplicate = entries[index];
      omittedDuplicates.push({
        rowNumber: duplicate.rowNumber,
        fullName: duplicate.fullName,
        dni: duplicate.dni,
        username: duplicate.username,
        reason: 'DNI repetido dentro del Excel.',
      });
    }
  }

  for (const entry of uniqueEntriesByDni.values()) {
    if (dryRun || excelOnly) {
      createdUsers.push(entry.username);
      console.log(`↺ Simulado: ${entry.username} (${entry.fullName})`);
      continue;
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        username: {
          equals: entry.username,
          mode: 'insensitive',
        },
      },
      select: { id: true, username: true },
    });

    if (existingUser) {
      omittedDuplicates.push({
        rowNumber: entry.rowNumber,
        fullName: entry.fullName,
        dni: entry.dni,
        username: entry.username,
        reason: 'El username ya existe en la base de datos.',
      });
      continue;
    }

    try {
      await createParticipantUser({
        fullName: entry.fullName,
        username: entry.username,
        password: entry.dni,
      });

      createdUsers.push(entry.username);
      console.log(`✓ Creado: ${entry.username} (${entry.fullName})`);
    } catch (error) {
      if (error instanceof AppError && error.statusCode === 409) {
        omittedDuplicates.push({
          rowNumber: entry.rowNumber,
          fullName: entry.fullName,
          dni: entry.dni,
          username: entry.username,
          reason: 'El username ya existe en la base de datos.',
        });
        continue;
      }

      const reason = error instanceof Error ? error.message : 'Error inesperado al crear el usuario.';
      rowErrors.push({ rowNumber: entry.rowNumber, reason });
    }
  }

  console.log('\nResumen de importación:');
  const modeLabel = dryRun ? 'solo revisión' : excelOnly ? 'solo Excel' : resetBeforeImport ? 'reinicio + creación real' : 'creación real';
  console.log(`- Modo: ${modeLabel}`);
  console.log(`- Usuarios creados: ${createdUsers.length}`);
  console.log(`- Usuarios omitidos por duplicado: ${omittedDuplicates.length}`);
  console.log(`- Filas con error: ${rowErrors.length}`);

  if (omittedDuplicates.length > 0) {
    console.log('\nDuplicados omitidos:');
    for (const duplicate of omittedDuplicates) {
      console.log(`- Fila ${duplicate.rowNumber}: ${duplicate.fullName} | DNI: ${duplicate.dni} | username: ${duplicate.username} (${duplicate.reason})`);
    }
  }

  const repeatedDniGroups = [...entriesByDni.entries()].filter(([, entries]) => entries.length > 1);
  if (repeatedDniGroups.length > 0) {
    console.log('\nDNI repetidos en el Excel:');
    for (const [dni, entries] of repeatedDniGroups) {
      const details = entries.map(entry => `${entry.fullName} | fila ${entry.rowNumber} | username ${entry.username}`).join(' || ');
      console.log(`- DNI ${dni}: ${details}`);
    }
  }

  if (rowErrors.length > 0) {
    console.log('\nFilas con error:');
    for (const rowError of rowErrors) {
      console.log(`- Fila ${rowError.rowNumber}: ${rowError.reason}`);
    }
    process.exitCode = 1;
  }

  if (createdUsers.length === 0 && omittedDuplicates.length === 0 && rowErrors.length === 0) {
    console.log('\nNo se encontraron filas para importar.');
  }
}

main()
  .catch(error => {
    const reason = error instanceof PrismaClientKnownRequestError ? error.message : error instanceof Error ? error.message : 'Error inesperado';
    console.error(`❌ Error al importar usuarios: ${reason}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });