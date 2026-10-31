import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { JwtService } from '@nestjs/jwt';

import type { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';
import { hashPassword } from './password';

interface PrismaMock {
  user: {
    findFirst: jest.Mock;
    update: jest.Mock;
  };
  refreshToken: {
    create: jest.Mock;
    findUnique: jest.Mock;
    update: jest.Mock;
    updateMany: jest.Mock;
    deleteMany: jest.Mock;
  };
  $transaction: jest.Mock;
}

function createPrismaMock(): PrismaMock {
  const prisma: PrismaMock = {
    user: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    refreshToken: {
      create: jest.fn().mockResolvedValue({}),
      findUnique: jest.fn(),
      update: jest.fn().mockResolvedValue({}),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
    $transaction: jest.fn().mockResolvedValue([]),
  };

  return prisma;
}

function createJwtMock(): { signAsync: jest.Mock } {
  return {
    signAsync: jest.fn().mockResolvedValue('access-token'),
  };
}

function createConfigMock(): { get: jest.Mock } {
  return {
    get: jest.fn((key: string) => {
      if (key === 'REFRESH_TOKEN_TTL_DAYS') {
        return '7';
      }

      return undefined;
    }),
  };
}

function createService(
  prisma: PrismaMock,
  jwt = createJwtMock(),
): {
  service: AuthService;
  jwt: { signAsync: jest.Mock };
} {
  const service = new AuthService(
    prisma as unknown as PrismaService,
    jwt as unknown as JwtService,
    createConfigMock() as unknown as ConfigService,
  );

  return { service, jwt };
}

async function createUser(overrides: Record<string, unknown> = {}) {
  return {
    id: 'user-1',
    gymId: 'gym-1',
    email: 'admin@gymflow.local',
    passwordHash: await hashPassword('Admin123!'),
    firstName: 'Admin',
    lastName: 'GymFlow',
    role: 'ADMIN' as const,
    active: true,
    lastLoginAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('AuthService', () => {
  describe('login', () => {
    it('devuelve tokens y datos públicos con credenciales correctas', async () => {
      const prisma = createPrismaMock();
      const user = await createUser();

      prisma.user.findFirst.mockResolvedValue(user);
      prisma.user.update.mockResolvedValue({
        ...user,
        lastLoginAt: new Date(),
      });

      const { service, jwt } = createService(prisma);

      const session = await service.login({
        email: '  ADMIN@GymFlow.local ',
        password: 'Admin123!',
      });

      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: { email: 'admin@gymflow.local' },
      });
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { lastLoginAt: expect.any(Date) },
        }),
      );
      expect(jwt.signAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: 'user-1',
          gymId: 'gym-1',
          role: 'ADMIN',
        }),
      );
      expect(session.accessToken).toBe('access-token');
      expect(session.refreshToken).toHaveLength(64);
      expect(session.user).not.toHaveProperty('passwordHash');
      expect(session.user.email).toBe('admin@gymflow.local');
    });

    it('omite el correo inexistente sin revelar el motivo', async () => {
      const prisma = createPrismaMock();
      prisma.user.findFirst.mockResolvedValue(null);

      const { service } = createService(prisma);

      await expect(
        service.login({
          email: 'nadie@gymflow.local',
          password: 'Admin123!',
        }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('rechaza contraseña incorrecta', async () => {
      const prisma = createPrismaMock();
      prisma.user.findFirst.mockResolvedValue(await createUser());

      const { service } = createService(prisma);

      await expect(
        service.login({
          email: 'admin@gymflow.local',
          password: 'Incorrecta123!',
        }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('impide el acceso de usuarios desactivados', async () => {
      const prisma = createPrismaMock();
      prisma.user.findFirst.mockResolvedValue(
        await createUser({ active: false }),
      );

      const { service } = createService(prisma);

      await expect(
        service.login({
          email: 'admin@gymflow.local',
          password: 'Admin123!',
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('refresh', () => {
    it('rota el token y revoca el anterior', async () => {
      const prisma = createPrismaMock();
      const user = await createUser();

      prisma.refreshToken.findUnique.mockResolvedValue({
        id: 'refresh-1',
        userId: user.id,
        tokenHash: 'hash',
        expiresAt: new Date(Date.now() + 60_000),
        revokedAt: null,
        createdAt: new Date(),
        user,
      });

      const { service } = createService(prisma);

      const session = await service.refresh('raw-token');

      expect(prisma.refreshToken.update).toHaveBeenCalledWith({
        where: { id: 'refresh-1' },
        data: { revokedAt: expect.any(Date) },
      });
      expect(prisma.refreshToken.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-1',
          tokenHash: expect.any(String),
          expiresAt: expect.any(Date),
        }),
      });
      expect(prisma.$transaction).toHaveBeenCalled();
      expect(session.refreshToken).not.toBe('raw-token');
    });

    it('revoca todas las sesiones si detecta reutilización', async () => {
      const prisma = createPrismaMock();

      prisma.refreshToken.findUnique.mockResolvedValue({
        id: 'refresh-1',
        userId: 'user-1',
        tokenHash: 'hash',
        expiresAt: new Date(Date.now() + 60_000),
        revokedAt: new Date(),
        createdAt: new Date(),
        user: await createUser(),
      });

      const { service } = createService(prisma);

      await expect(service.refresh('reused-token')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', revokedAt: null },
        data: { revokedAt: expect.any(Date) },
      });
    });

    it('rechaza tokens vencidos y tokens inexistentes', async () => {
      const prisma = createPrismaMock();

      prisma.refreshToken.findUnique.mockResolvedValue({
        id: 'refresh-1',
        userId: 'user-1',
        tokenHash: 'hash',
        expiresAt: new Date(Date.now() - 1_000),
        revokedAt: null,
        createdAt: new Date(),
        user: await createUser(),
      });

      const { service } = createService(prisma);

      await expect(service.refresh('old-token')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
      expect(prisma.refreshToken.update).toHaveBeenCalled();

      prisma.refreshToken.findUnique.mockResolvedValue(null);

      await expect(service.refresh('unknown-token')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
      await expect(service.refresh()).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });
  });

  describe('logout y perfil', () => {
    it('revoca el refresh token recibido', async () => {
      const prisma = createPrismaMock();
      const { service } = createService(prisma);

      await service.logout('raw-token');

      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: {
          tokenHash: expect.stringMatching(/^[a-f0-9]{64}$/),
          revokedAt: null,
        },
        data: { revokedAt: expect.any(Date) },
      });
    });

    it('no falla al cerrar sesión sin token', async () => {
      const prisma = createPrismaMock();
      const { service } = createService(prisma);

      await expect(service.logout()).resolves.toBeUndefined();
      expect(prisma.refreshToken.updateMany).not.toHaveBeenCalled();
    });

    it('devuelve el perfil del usuario activo y rechaza inactivos', async () => {
      const prisma = createPrismaMock();
      const user = await createUser();

      prisma.user.findFirst.mockResolvedValue(user);

      const { service } = createService(prisma);

      await expect(service.getProfile('user-1')).resolves.toEqual(
        expect.objectContaining({ id: 'user-1', role: 'ADMIN' }),
      );

      prisma.user.findFirst.mockResolvedValue(null);

      await expect(service.getProfile('user-1')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });
  });
});
