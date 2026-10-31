import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';

import type { PrismaService } from '../prisma/prisma.service';
import { verifyPassword } from '../auth/password';
import { UsersService } from './users.service';

interface PrismaMock {
  user: {
    findMany: jest.Mock;
    findFirst: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    count: jest.Mock;
  };
}

function createPrismaMock(): PrismaMock {
  return {
    user: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
  };
}

function createService(prisma: PrismaMock): UsersService {
  return new UsersService(prisma as unknown as PrismaService);
}

const baseUser = {
  id: 'user-1',
  gymId: 'gym-1',
  email: 'admin@gymflow.local',
  passwordHash: 'hash',
  firstName: 'Admin',
  lastName: 'GymFlow',
  role: 'ADMIN' as const,
  active: true,
  lastLoginAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('UsersService', () => {
  describe('create', () => {
    it('crea el usuario con contraseña hasheada y datos normalizados', async () => {
      const prisma = createPrismaMock();

      prisma.user.findFirst.mockResolvedValue(null);
      prisma.user.create.mockImplementation(
        ({ data }: { data: Record<string, unknown> }) => {
          const createdUser: Record<string, unknown> = {
            ...baseUser,
            ...data,
          };

          delete createdUser.passwordHash;

          return createdUser;
        },
      );

      const service = createService(prisma);

      const created = await service.create('gym-1', {
        email: 'nuevo@gymflow.local',
        firstName: '  Nuevo ',
        lastName: ' Usuario ',
        password: 'Recepcion123!',
        role: 'RECEPTION',
      });

      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            gymId: 'gym-1',
            email: 'nuevo@gymflow.local',
            firstName: 'Nuevo',
            lastName: 'Usuario',
            role: 'RECEPTION',
            passwordHash: expect.stringMatching(/^scrypt\$/),
          }),
        }),
      );
      expect(created).not.toHaveProperty('passwordHash');

      const [createCall] = prisma.user.create.mock.calls as Array<
        [{ data: { passwordHash: string } }]
      >;

      const stored = await verifyPassword(
        'Recepcion123!',
        createCall[0].data.passwordHash,
      );

      expect(stored).toBe(true);
    });

    it('rechaza correos duplicados en el gimnasio', async () => {
      const prisma = createPrismaMock();

      prisma.user.findFirst.mockResolvedValue({ id: 'user-1' });

      const service = createService(prisma);

      await expect(
        service.create('gym-1', {
          email: 'admin@gymflow.local',
          firstName: 'Otro',
          lastName: 'Admin',
          password: 'Admin123!',
          role: 'ADMIN',
        }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.user.create).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('permite actualizar datos de otro usuario', async () => {
      const prisma = createPrismaMock();

      prisma.user.findFirst.mockResolvedValue(baseUser);
      prisma.user.update.mockResolvedValue({
        ...baseUser,
        firstName: 'Administrador',
      });

      const service = createService(prisma);

      await service.update(
        'gym-1',
        'user-1',
        { firstName: 'Administrador' },
        'actor-1',
      );

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-1' },
          data: { firstName: 'Administrador' },
        }),
      );
    });

    it('impide que el actor se quite el rol admin o se desactive', async () => {
      const prisma = createPrismaMock();

      prisma.user.findFirst.mockResolvedValue(baseUser);

      const service = createService(prisma);

      await expect(
        service.update('gym-1', 'user-1', { role: 'RECEPTION' }, 'user-1'),
      ).rejects.toBeInstanceOf(BadRequestException);

      await expect(
        service.update('gym-1', 'user-1', { active: false }, 'user-1'),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('exige al menos un administrador activo', async () => {
      const prisma = createPrismaMock();

      prisma.user.findFirst.mockResolvedValue(baseUser);
      prisma.user.count.mockResolvedValue(0);

      const service = createService(prisma);

      await expect(
        service.update('gym-1', 'user-1', { active: false }, 'actor-1'),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('permite desactivar un admin si queda otro activo', async () => {
      const prisma = createPrismaMock();

      prisma.user.findFirst.mockResolvedValue(baseUser);
      prisma.user.count.mockResolvedValue(1);
      prisma.user.update.mockResolvedValue({
        ...baseUser,
        active: false,
      });

      const service = createService(prisma);

      await service.update('gym-1', 'user-1', { active: false }, 'actor-1');

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { active: false },
        }),
      );
    });

    it('rechaza usuarios inexistentes', async () => {
      const prisma = createPrismaMock();

      prisma.user.findFirst.mockResolvedValue(null);

      const service = createService(prisma);

      await expect(
        service.update('gym-1', 'missing', {}, 'actor-1'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
