import { Logger, NotFoundException } from '@nestjs/common';

import type { PrismaService } from '../prisma/prisma.service';
import { MembersService } from './members.service';

interface PrismaMock {
  member: {
    findFirst: jest.Mock;
    update: jest.Mock;
  };
}

function createPrismaMock(): PrismaMock {
  return {
    member: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  };
}

function createService(prisma: PrismaMock): MembersService {
  return new MembersService(prisma as unknown as PrismaService);
}

const member = {
  id: 'member-1',
  gymId: 'gym-1',
  firstName: 'Ana',
  lastName: 'Perez',
  memberCode: 'DEMO-001',
  documentNumber: '12345678',
  phone: '999999999',
  email: 'ana@example.com',
  qrToken: 'old-token',
};

describe('MembersService', () => {
  beforeEach(() => {
    jest.spyOn(Logger.prototype, 'log').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('regenerateQrToken', () => {
    it('rota el token y registra la auditoría', async () => {
      const prisma = createPrismaMock();

      prisma.member.findFirst.mockResolvedValue(member);
      prisma.member.update.mockResolvedValue({
        ...member,
        qrToken: 'new-token',
      });

      const service = createService(prisma);

      const result = await service.regenerateQrToken('gym-1', 'member-1', {
        reason: '  Pérdida de tarjeta  ',
      });

      expect(prisma.member.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'member-1',
          gymId: 'gym-1',
        },
      });

      expect(prisma.member.update).toHaveBeenCalledWith({
        where: {
          id: 'member-1',
        },
        data: {
          qrToken: expect.stringMatching(
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
          ),
          qrTokenRegeneratedAt: expect.any(Date),
          qrTokenRegenerationReason: 'Pérdida de tarjeta',
        },
      });

      expect(result.qrToken).toBe('new-token');
    });

    it('usa un motivo por defecto cuando no se envía uno', async () => {
      const prisma = createPrismaMock();

      prisma.member.findFirst.mockResolvedValue(member);
      prisma.member.update.mockResolvedValue({
        ...member,
        qrToken: 'new-token',
      });

      const service = createService(prisma);

      await service.regenerateQrToken('gym-1', 'member-1', {
        reason: '   ',
      });

      expect(prisma.member.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            qrTokenRegenerationReason: 'Regeneración manual desde la interfaz',
          }),
        }),
      );
    });

    it('rechaza socios inexistentes o de otro gimnasio', async () => {
      const prisma = createPrismaMock();
      prisma.member.findFirst.mockResolvedValue(null);

      const service = createService(prisma);

      await expect(
        service.regenerateQrToken('gym-1', 'member-1', {}),
      ).rejects.toBeInstanceOf(NotFoundException);

      expect(prisma.member.update).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('limpia los campos opcionales enviando null', async () => {
      const prisma = createPrismaMock();

      prisma.member.findFirst.mockResolvedValue(member);
      prisma.member.update.mockResolvedValue(member);

      const service = createService(prisma);

      await service.update('gym-1', 'member-1', {
        documentNumber: null,
        phone: null,
        email: null,
      });

      expect(prisma.member.update).toHaveBeenCalledWith({
        where: {
          id: 'member-1',
        },
        data: {
          documentNumber: null,
          phone: null,
          email: null,
        },
      });
    });

    it('conserva el código actual si se envía vacío', async () => {
      const prisma = createPrismaMock();

      prisma.member.findFirst.mockResolvedValue(member);
      prisma.member.update.mockResolvedValue(member);

      const service = createService(prisma);

      await service.update('gym-1', 'member-1', {
        memberCode: '   ',
        firstName: 'Ana María',
      });

      expect(prisma.member.update).toHaveBeenCalledWith({
        where: {
          id: 'member-1',
        },
        data: {
          firstName: 'Ana María',
        },
      });
    });

    it('normaliza el código cuando se envía uno nuevo', async () => {
      const prisma = createPrismaMock();

      prisma.member.findFirst
        .mockResolvedValueOnce(member)
        .mockResolvedValueOnce(null);
      prisma.member.update.mockResolvedValue(member);

      const service = createService(prisma);

      await service.update('gym-1', 'member-1', {
        memberCode: ' nuevo-01 ',
      });

      expect(prisma.member.update).toHaveBeenCalledWith({
        where: {
          id: 'member-1',
        },
        data: {
          memberCode: 'NUEVO-01',
        },
      });
    });
  });
});
