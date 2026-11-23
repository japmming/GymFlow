import { ConflictException, NotFoundException } from '@nestjs/common';

import type { PrismaService } from '../prisma/prisma.service';

import { OPENING_DAYS, type OpeningHours } from './dto/update-gym.dto';
import { GymsService } from './gyms.service';

interface PrismaMock {
  gym: {
    findFirst: jest.Mock;
    update: jest.Mock;
  };
}

function createPrismaMock(): PrismaMock {
  return {
    gym: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  };
}

function createService(prisma: PrismaMock): GymsService {
  return new GymsService(prisma as unknown as PrismaService);
}

function buildOpeningHours(): OpeningHours {
  return OPENING_DAYS.reduce((hours, day) => {
    hours[day] = {
      closed: day === 'sunday',
      interval: {
        start: '09:00',
        end: day === 'saturday' ? '13:00' : '18:00',
      },
    };

    return hours;
  }, {} as OpeningHours);
}

const openingHours = buildOpeningHours();

const baseGym = {
  id: 'gym-1',
  name: 'GymFlow Demo',
  slug: 'gymflow-demo',
  timezone: 'America/Lima',
  currency: 'PEN',
  logoUrl: null,
  openingHours: null,
  createdAt: new Date('2026-10-17T14:41:52.740Z'),
  updatedAt: new Date('2026-11-22T12:00:00.000Z'),
};

describe('GymsService', () => {
  describe('findOne', () => {
    it('devuelve la configuración con los horarios normalizados', async () => {
      const prisma = createPrismaMock();

      prisma.gym.findFirst.mockResolvedValue({
        ...baseGym,
        openingHours,
      });

      const result = await createService(prisma).findOne('gym-1');

      expect(result).toEqual({
        ...baseGym,
        openingHours,
      });
    });

    it('devuelve horarios null cuando el JSON guardado no es válido', async () => {
      const prisma = createPrismaMock();

      prisma.gym.findFirst.mockResolvedValue({
        ...baseGym,
        openingHours: { monday: { closed: false } },
      });

      const result = await createService(prisma).findOne('gym-1');

      expect(result.openingHours).toBeNull();
    });

    it('falla cuando el gimnasio no existe', async () => {
      const prisma = createPrismaMock();

      prisma.gym.findFirst.mockResolvedValue(null);

      await expect(
        createService(prisma).findOne('gym-1'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('update', () => {
    it('guarda los campos enviados y reemplaza los horarios completos', async () => {
      const prisma = createPrismaMock();

      prisma.gym.findFirst.mockResolvedValueOnce({
        id: 'gym-1',
        slug: 'gymflow-demo',
      });

      prisma.gym.update.mockImplementation(
        ({ data }: { data: Record<string, unknown> }) => ({
          ...baseGym,
          ...data,
        }),
      );

      const result = await createService(prisma).update('gym-1', {
        name: '  GymFlow Demo  ',
        slug: 'gymflow-demo',
        timezone: 'America/Lima',
        currency: 'PEN',
        logoUrl: null,
        openingHours,
      });

      expect(prisma.gym.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'gym-1' },
          data: {
            name: 'GymFlow Demo',
            slug: 'gymflow-demo',
            timezone: 'America/Lima',
            currency: 'PEN',
            logoUrl: null,
            openingHours,
          },
        }),
      );
      expect(result.openingHours).toEqual(openingHours);
    });

    it('no modifica campos que no se enviaron', async () => {
      const prisma = createPrismaMock();

      prisma.gym.findFirst.mockResolvedValueOnce({
        id: 'gym-1',
        slug: 'gymflow-demo',
      });

      prisma.gym.update.mockImplementation(() => baseGym);

      await createService(prisma).update('gym-1', { currency: 'USD' });

      expect(prisma.gym.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { currency: 'USD' },
        }),
      );
    });

    it('rechaza un slug ya usado por otro gimnasio', async () => {
      const prisma = createPrismaMock();

      prisma.gym.findFirst
        .mockResolvedValueOnce({ id: 'gym-1', slug: 'gymflow-demo' })
        .mockResolvedValueOnce({ id: 'gym-2' });

      await expect(
        createService(prisma).update('gym-1', { slug: 'otro-gym' }),
      ).rejects.toBeInstanceOf(ConflictException);

      expect(prisma.gym.update).not.toHaveBeenCalled();
    });

    it('falla cuando el gimnasio no existe', async () => {
      const prisma = createPrismaMock();

      prisma.gym.findFirst.mockResolvedValue(null);

      await expect(
        createService(prisma).update('gym-1', { name: 'Otro gimnasio' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
