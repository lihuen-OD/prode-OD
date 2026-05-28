import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verify() {
  const user = await prisma.user.findUnique({
    where: { username: 'admin' },
    select: { username: true, role: true, email: true }
  });

  const tournament = await prisma.tournament.findFirst({
    select: { name: true, status: true, predictionsCloseAt: true }
  });

  const setting = await prisma.appSetting.findFirst({
    select: { resultsSource: true }
  });

  console.log('✅ SEED VERIFICATION:');
  console.log('Admin user:', user);
  console.log('Tournament:', tournament);
  console.log('AppSetting:', setting);

  await prisma.$disconnect();
}

verify().catch(e => {
  console.error('❌ Error:', e.message);
  process.exit(1);
});
