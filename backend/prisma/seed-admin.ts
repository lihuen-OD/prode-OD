import 'dotenv/config';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { prisma } from '../src/config/prisma.js';

const seedAdminSchema = z.object({
  ADMIN_FULL_NAME: z.string().min(1),
  ADMIN_USERNAME: z.string().min(1),
  ADMIN_PASSWORD: z.string().min(8),
  ADMIN_EMAIL: z.string().email(),
});

const seedAdmin = seedAdminSchema.parse(process.env);

async function main() {
  const passwordHash = await bcrypt.hash(seedAdmin.ADMIN_PASSWORD, 10);

  await prisma.user.upsert({
    where: { username: seedAdmin.ADMIN_USERNAME },
    update: {
      fullName: seedAdmin.ADMIN_FULL_NAME,
      email: seedAdmin.ADMIN_EMAIL,
      passwordHash,
      role: 'ADMIN',
      paymentStatus: 'PAID',
      isActive: true,
    },
    create: {
      fullName: seedAdmin.ADMIN_FULL_NAME,
      username: seedAdmin.ADMIN_USERNAME,
      passwordHash,
      email: seedAdmin.ADMIN_EMAIL,
      role: 'ADMIN',
      paymentStatus: 'PAID',
      isActive: true,
    },
  });

  console.log(`✓ Admin creado/actualizado: ${seedAdmin.ADMIN_USERNAME}`);

  // Ensure a default tournament exists so public settings endpoint works
  const existingTournament = await prisma.tournament.findFirst();
  if (!existingTournament) {
    // Set predictions close at 7 days from now by default
    const closeAt = new Date();
    closeAt.setDate(closeAt.getDate() + 7);
    await prisma.tournament.create({
      data: {
        name: 'Prode Mundial 2026',
        status: 'OPEN',
        predictionsCloseAt: closeAt,
      },
    });
    console.log('✓ Tournament creado: Prode Mundial 2026');
  }

  // Ensure an app setting exists
  const existingAppSetting = await prisma.appSetting.findFirst();
  if (!existingAppSetting) {
    await prisma.appSetting.create({ data: { resultsSource: 'MANUAL' } });
    console.log('✓ AppSetting creado: resultsSource=MANUAL');
  }
}

main()
  .catch(error => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

