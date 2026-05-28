import { prisma } from '../src/config/prisma.js';
import { recalculateRankingSnapshots } from '../src/utils/ranking.js';

async function main() {
  const tournament = await prisma.tournament.findFirst({
    orderBy: { createdAt: 'desc' },
    select: { id: true },
  });

  if (!tournament) {
    console.log('No hay torneo configurado');
    return;
  }

  await recalculateRankingSnapshots(tournament.id);
  console.log('Ranking recalculado para el torneo actual');
}

try {
  await main();
} finally {
  await prisma.$disconnect();
}