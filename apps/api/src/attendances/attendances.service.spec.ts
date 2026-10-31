import { BadRequestException, ConflictException } from '@nestjs/common';

import type { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../generated/prisma/client';
import { AttendancesService } from './attendances.service';

interface PrismaMock {
  member: {
    findFirst: jest.Mock;
  };
  gym: {
    findFirst: jest.Mock;
  };
  membership: {
    findFirst: jest.Mock;
  };
  attendance: {
    findFirst: jest.Mock;
    create: jest.Mock;
  };
}

function createPrismaMock(): PrismaMock {
  return {
    member: {
      findFirst: jest.fn(),
    },
    gym: {
      findFirst: jest.fn(),
    },
    membership: {
      findFirst: jest.fn(),
    },
    attendance: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  };
}

const member = {
  id: 'member-1',
  gymId: 'gym-1',
  firstName: 'Ana',
  lastName: 'Perez',
  memberCode: 'DEMO-001',
  qrToken: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  status: 'ACTIVE',
};

const membership = {
  id: 'membership-1',
  gymId: 'gym-1',
  memberId: 'member-1',
  price: 50,
  status: 'ACTIVE',
  startDate: new Date('2026-10-01T00:00:00.000Z'),
  endDate: new Date('2026-11-30T00:00:00.000Z'),
  plan: {
    id: 'plan-1',
    name: 'Plan Mensual',
  },
  payments: [{ amount: 20, status: 'COMPLETED' }],
};

function createService(prisma: PrismaMock): AttendancesService {
  return new AttendancesService(prisma as unknown as PrismaService);
}

describe('AttendancesService.checkIn', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-10-30T15:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('rechaza enviar QR y código de socio a la vez', async () => {
    const service = createService(createPrismaMock());

    await expect(
      service.checkIn('gym-1', {
        qrToken: member.qrToken,
        memberCode: member.memberCode,
      }),
    ).rejects.toThrow('Envía solo una opción: código QR o código de socio.');
  });

  it('rechaza cuando no se envía ningún identificador', async () => {
    const service = createService(createPrismaMock());

    await expect(service.checkIn('gym-1', {})).rejects.toThrow(
      'Debes enviar un código QR o un código de socio.',
    );
  });

  it('rechaza un QR que no pertenece a ningún socio', async () => {
    const prisma = createPrismaMock();
    prisma.member.findFirst.mockResolvedValue(null);

    const service = createService(prisma);

    await expect(
      service.checkIn('gym-1', {
        qrToken: '00000000-0000-0000-0000-000000000000',
      }),
    ).rejects.toThrow('El código QR no es válido.');
  });

  it('rechaza socios inactivos', async () => {
    const prisma = createPrismaMock();
    prisma.member.findFirst.mockResolvedValue({
      ...member,
      status: 'INACTIVE',
    });

    const service = createService(prisma);

    await expect(
      service.checkIn('gym-1', {
        qrToken: member.qrToken,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.gym.findFirst).not.toHaveBeenCalled();
  });

  it('rechaza socios sin membresía vigente', async () => {
    const prisma = createPrismaMock();
    prisma.member.findFirst.mockResolvedValue(member);
    prisma.gym.findFirst.mockResolvedValue({
      timezone: 'America/Lima',
    });
    prisma.membership.findFirst.mockResolvedValue(null);

    const service = createService(prisma);

    await expect(
      service.checkIn('gym-1', {
        memberCode: member.memberCode,
      }),
    ).rejects.toThrow('El miembro no tiene una membresía vigente.');
  });

  it('rechaza membresías sin pagos registrados', async () => {
    const prisma = createPrismaMock();
    prisma.member.findFirst.mockResolvedValue(member);
    prisma.gym.findFirst.mockResolvedValue({
      timezone: 'America/Lima',
    });
    prisma.membership.findFirst.mockResolvedValue({
      ...membership,
      payments: [{ amount: 50, status: 'REFUNDED' }],
    });

    const service = createService(prisma);

    await expect(
      service.checkIn('gym-1', {
        memberCode: member.memberCode,
      }),
    ).rejects.toThrow(
      'La membresía no tiene pagos registrados. Registra al menos un pago para permitir el ingreso.',
    );

    expect(prisma.attendance.create).not.toHaveBeenCalled();
  });

  it('rechaza un segundo ingreso el mismo día', async () => {
    const prisma = createPrismaMock();
    prisma.member.findFirst.mockResolvedValue(member);
    prisma.gym.findFirst.mockResolvedValue({
      timezone: 'America/Lima',
    });
    prisma.membership.findFirst.mockResolvedValue(membership);
    prisma.attendance.findFirst.mockResolvedValue({
      id: 'attendance-0',
    });

    const service = createService(prisma);

    await expect(
      service.checkIn('gym-1', {
        memberCode: member.memberCode,
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(prisma.attendance.create).not.toHaveBeenCalled();
  });

  it('registra el ingreso por QR con la fecha local y el resumen de pago', async () => {
    const prisma = createPrismaMock();
    prisma.member.findFirst.mockResolvedValue(member);
    prisma.gym.findFirst.mockResolvedValue({
      timezone: 'America/Lima',
    });
    prisma.membership.findFirst.mockResolvedValue(membership);
    prisma.attendance.findFirst.mockResolvedValue(null);
    prisma.attendance.create.mockResolvedValue({
      id: 'attendance-1',
      memberId: member.id,
      membershipId: membership.id,
      attendanceDate: new Date('2026-10-30T00:00:00.000Z'),
      source: 'QR',
      member,
      membership,
    });

    const service = createService(prisma);

    const result = await service.checkIn('gym-1', {
      qrToken: member.qrToken,
    });

    expect(prisma.member.findFirst).toHaveBeenCalledWith({
      where: {
        gymId: 'gym-1',
        qrToken: member.qrToken,
      },
    });

    expect(prisma.attendance.create).toHaveBeenCalledWith({
      data: {
        gymId: 'gym-1',
        memberId: member.id,
        membershipId: membership.id,
        attendanceDate: new Date('2026-10-30T00:00:00.000Z'),
        source: 'QR',
        activeKey: 'ACTIVE',
      },
      include: expect.any(Object),
    });

    expect(result.membership).toEqual(
      expect.objectContaining({
        paidAmount: 20,
        balance: 30,
      }),
    );
  });

  it('normaliza el código de socio y registra el origen MEMBER_CODE', async () => {
    const prisma = createPrismaMock();
    prisma.member.findFirst.mockResolvedValue(member);
    prisma.gym.findFirst.mockResolvedValue({
      timezone: 'America/Lima',
    });
    prisma.membership.findFirst.mockResolvedValue(membership);
    prisma.attendance.findFirst.mockResolvedValue(null);
    prisma.attendance.create.mockResolvedValue({
      id: 'attendance-1',
      memberId: member.id,
      membershipId: membership.id,
      attendanceDate: new Date('2026-10-30T00:00:00.000Z'),
      source: 'MEMBER_CODE',
      member,
      membership,
    });

    const service = createService(prisma);

    await service.checkIn('gym-1', {
      memberCode: ' demo-001 ',
    });

    expect(prisma.member.findFirst).toHaveBeenCalledWith({
      where: {
        gymId: 'gym-1',
        memberCode: 'DEMO-001',
      },
    });

    expect(prisma.attendance.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          source: 'MEMBER_CODE',
        }),
      }),
    );
  });

  it('convierte un duplicado concurrente en conflicto', async () => {
    const prisma = createPrismaMock();
    prisma.member.findFirst.mockResolvedValue(member);
    prisma.gym.findFirst.mockResolvedValue({
      timezone: 'America/Lima',
    });
    prisma.membership.findFirst.mockResolvedValue(membership);
    prisma.attendance.findFirst.mockResolvedValue(null);

    const duplicateError = Object.assign(
      Object.create(Prisma.PrismaClientKnownRequestError.prototype) as {
        code: string;
      },
      { code: 'P2002' },
    );

    prisma.attendance.create.mockRejectedValue(duplicateError);

    const service = createService(prisma);

    await expect(
      service.checkIn('gym-1', {
        memberCode: member.memberCode,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
