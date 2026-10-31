import 'dotenv/config';

import { PrismaPg } from '@prisma/adapter-pg';

import { hashPassword } from '../auth/password';
import { PrismaClient, type UserRole } from '../generated/prisma/client';

const GYM_ID = '00000000-0000-0000-0000-000000000001';
const GYM_SLUG = 'gymflow-demo';

interface SeedUser {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

function readSeedUser(
  prefix: 'ADMIN' | 'RECEPTION',
  defaults: SeedUser,
): SeedUser {
  return {
    email: (process.env[`SEED_${prefix}_EMAIL`] ?? defaults.email)
      .trim()
      .toLowerCase(),
    password: process.env[`SEED_${prefix}_PASSWORD`] ?? defaults.password,
    firstName: defaults.firstName,
    lastName: defaults.lastName,
    role: defaults.role,
  };
}

async function main(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('Falta la variable de entorno DATABASE_URL.');
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });

  const admin = readSeedUser('ADMIN', {
    email: 'admin@gymflow.local',
    password: 'Admin123!',
    firstName: 'Administrador',
    lastName: 'GymFlow',
    role: 'ADMIN',
  });

  const reception = readSeedUser('RECEPTION', {
    email: 'recepcion@gymflow.local',
    password: 'Recepcion123!',
    firstName: 'Recepción',
    lastName: 'GymFlow',
    role: 'RECEPTION',
  });

  try {
    const gym = await prisma.gym.upsert({
      where: {
        id: GYM_ID,
      },
      update: {},
      create: {
        id: GYM_ID,
        name: 'GymFlow Demo',
        slug: GYM_SLUG,
        timezone: 'America/Lima',
      },
    });

    for (const user of [admin, reception]) {
      const existing = await prisma.user.findFirst({
        where: {
          gymId: gym.id,
          email: user.email,
        },
        select: {
          id: true,
        },
      });

      if (existing) {
        console.log(`El usuario ${user.email} ya existe; no se modifica.`);
        continue;
      }

      await prisma.user.create({
        data: {
          gymId: gym.id,
          email: user.email,
          passwordHash: await hashPassword(user.password),
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
      });

      console.log(
        `Usuario ${user.role} creado: ${user.email} / ${user.password}`,
      );
    }

    console.log(
      'Seed completado. Cambia las contraseñas demo antes de usar datos reales.',
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
