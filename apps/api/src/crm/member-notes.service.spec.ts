import { NotFoundException } from '@nestjs/common';

import type { PrismaService } from '../prisma/prisma.service';

import { MemberNotesService } from './member-notes.service';

interface PrismaMock {
  member: { findFirst: jest.Mock };
  memberNote: {
    findMany: jest.Mock;
    findFirst: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
  attendance: { findMany: jest.Mock };
  payment: { findMany: jest.Mock };
  membership: { findMany: jest.Mock };
  reservation: { findMany: jest.Mock };
}

function createPrismaMock(): PrismaMock {
  return {
    member: { findFirst: jest.fn() },
    memberNote: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    attendance: { findMany: jest.fn() },
    payment: { findMany: jest.fn() },
    membership: { findMany: jest.fn() },
    reservation: { findMany: jest.fn() },
  };
}

function createService(prisma: PrismaMock): MemberNotesService {
  return new MemberNotesService(prisma as unknown as PrismaService);
}

const note = {
  id: 'note-1',
  gymId: 'gym-1',
  memberId: 'member-1',
  authorId: 'user-1',
  body: 'Nota de prueba',
  createdAt: new Date('2026-11-20T10:00:00.000Z'),
  updatedAt: new Date('2026-11-20T10:00:00.000Z'),
  author: { id: 'user-1', firstName: 'Ana', lastName: 'Torres' },
};

function existingMember(prisma: PrismaMock) {
  prisma.member.findFirst.mockResolvedValue({ id: 'member-1' });
}

describe('MemberNotesService', () => {
  describe('validación del socio', () => {
    it('falla si el socio no pertenece al gimnasio', async () => {
      const prisma = createPrismaMock();

      prisma.member.findFirst.mockResolvedValue(null);

      await expect(
        createService(prisma).findAll('gym-1', 'missing'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('notas', () => {
    it('lista las notas del socio filtrando por gimnasio', async () => {
      const prisma = createPrismaMock();

      existingMember(prisma);
      prisma.memberNote.findMany.mockResolvedValue([note]);

      const result = await createService(prisma).findAll('gym-1', 'member-1');

      expect(result).toEqual([note]);
      expect(prisma.memberNote.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { gymId: 'gym-1', memberId: 'member-1' },
        }),
      );
    });

    it('crea una nota con el autor autenticado y el contenido recortado', async () => {
      const prisma = createPrismaMock();

      existingMember(prisma);
      prisma.memberNote.create.mockImplementation(
        ({ data }: { data: Record<string, unknown> }) => ({
          ...note,
          ...data,
        }),
      );

      await createService(prisma).create('gym-1', 'member-1', 'user-1', {
        body: '  Nota de prueba  ',
      });

      expect(prisma.memberNote.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            gymId: 'gym-1',
            memberId: 'member-1',
            authorId: 'user-1',
            body: 'Nota de prueba',
          },
        }),
      );
    });

    it('no edita una nota que no pertenece al socio', async () => {
      const prisma = createPrismaMock();

      existingMember(prisma);
      prisma.memberNote.findFirst.mockResolvedValue(null);

      await expect(
        createService(prisma).update('gym-1', 'member-1', 'note-2', {
          body: 'Otra nota',
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('elimina una nota existente', async () => {
      const prisma = createPrismaMock();

      existingMember(prisma);
      prisma.memberNote.findFirst.mockResolvedValue({ id: 'note-1' });
      prisma.memberNote.delete.mockResolvedValue(note);

      await expect(
        createService(prisma).remove('gym-1', 'member-1', 'note-1'),
      ).resolves.toEqual({ success: true });
      expect(prisma.memberNote.delete).toHaveBeenCalledWith({
        where: { id: 'note-1' },
      });
    });
  });

  describe('historial de interacciones', () => {
    it('combina los eventos del socio y los ordena por fecha descendente', async () => {
      const prisma = createPrismaMock();

      existingMember(prisma);
      prisma.memberNote.findMany.mockResolvedValue([
        {
          id: 'note-1',
          body: 'Nota de prueba',
          createdAt: new Date('2026-11-20T10:00:00.000Z'),
        },
      ]);
      prisma.attendance.findMany.mockResolvedValue([
        {
          id: 'attendance-1',
          checkedInAt: new Date('2026-11-22T08:00:00.000Z'),
          attendanceDate: new Date('2026-11-22T00:00:00.000Z'),
          source: 'QR',
        },
      ]);
      prisma.payment.findMany.mockResolvedValue([]);
      prisma.membership.findMany.mockResolvedValue([]);
      prisma.reservation.findMany.mockResolvedValue([]);

      const result = await createService(prisma).getActivity(
        'gym-1',
        'member-1',
      );

      expect(result.map((item) => item.type)).toEqual(['ATTENDANCE', 'NOTE']);
      expect(result[0].title).toBe('Ingreso al gimnasio');
      expect(result[1].description).toBe('Nota de prueba');
    });
  });
});
