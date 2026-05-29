import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import { prisma } from '../src/config/prisma.js';
import XLSX from 'xlsx';

const outputPath = path.resolve(process.cwd(), 'data', 'USUARIOS_NOMBRE_USERNAME.xlsx');

async function main() {
  await fs.mkdir(path.dirname(outputPath), { recursive: true });

  const users = await prisma.user.findMany({
    where: { role: 'USER' },
    select: {
      fullName: true,
      username: true,
    },
    orderBy: [{ fullName: 'asc' }, { username: 'asc' }],
  });

  const rows = users.map((user: { fullName: any; username: any; }) => ({
    'NOMBRE COMPLETO': user.fullName,
    USERNAME: user.username,
  }));

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(rows, {
    header: ['NOMBRE COMPLETO', 'USERNAME'],
  });

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Usuarios');
  XLSX.writeFile(workbook, outputPath);

  console.log(`✓ Excel generado: ${outputPath}`);
  console.log(`✓ Usuarios exportados: ${users.length}`);
}

main()
  .catch(error => {
    const reason = error instanceof Error ? error.message : 'Error inesperado';
    console.error(`❌ Error al exportar usuarios: ${reason}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });