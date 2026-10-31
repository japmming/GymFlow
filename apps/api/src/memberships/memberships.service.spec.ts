import { BadRequestException, NotFoundException } from '@nestjs/common';

import type { PrismaService } from '../prisma/prisma.service';
import { parseDateKey } from '../common/date.utils';
import { MembershipsService } from './memberships.service';

interface PrismaMock {
  member: {
    findFirst: jest.Mock;
  };
  plan: {
    findFirst: jest.Mock;
  };
  gym: {
    findFirst: jest.Mock;
  };
  membership: {
    findFirst: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
  };
}

function createPrismaMock(): PrismaMock {
  return {
    member: {
      findFirst: jest.fn(),
    },
    plan: {
      findFirst: jest.fn(),
    },
    gym: {
      findFirst: jest.fn(),
    },
    membership: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };
}

const member = {
  id: 'member-1',
  gymId: 'gym-1',
  firstName: 'Ana',
  lastName: 'Perez',
  status: 'ACTIVE',
};

const plan = {
  id: 'plan-1',
  gymId: 'gym-1',
  name: 'Plan Mensual',
  durationDays: 30,
  price: 49.9,
  active: true,
};

function createService(prisma: PrismaMock): MembershipsService {
  return new MembershipsService(prisma as unknown as PrismaService);
}

function setupMembershipCreation(prisma: PrismaMock): void {
  prisma.member.findFirst.mockResolvedValue(member);
  prisma.plan.findFirst.mockResolvedValue(plan);
  prisma.gym.findFirst.mockResolvedValue({
    timezone: 'America/Lima',
  });
}

describe('MembershipsService.create', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-10-30T15:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('rechaza fechas de inicio anteriores a hoy', async () => {
    const prisma = createPrismaMock();
    setupMembershipCreation(prisma);

    const service = createService(prisma);

    await expect(
      service.create('gym-1', {
        memberId: member.id,
        planId: plan.id,
        startDate: '2026-10-29',
      }),
    ).rejects.toThrow('La fecha de inicio no puede ser anterior a hoy.');

    expect(prisma.membership.create).not.toHaveBeenCalled();
  });

  it('calcula el fin inclusivo según la duración del plan', async () => {
    const prisma = createPrismaMock();
    setupMembershipCreation(prisma);
    prisma.membership.findFirst.mockResolvedValue(null);
    prisma.membership.create.mockResolvedValue({
      id: 'membership-1',
      member,
      plan,
      payments: [],
    });

    const service = createService(prisma);

    await service.create('gym-1', {
      memberId: member.id,
      planId: plan.id,
      startDate: '2026-11-01',
    });

    expect(prisma.membership.create).toHaveBeenCalledWith({
      data: {
        gymId: 'gym-1',
        memberId: member.id,
        planId: plan.id,
        startDate: parseDateKey('2026-11-01'),
        endDate: parseDateKey('2026-11-30'),
        price: plan.price,
        status: 'ACTIVE',
      },
      include: expect.any(Object),
    });
  });

  it('inicia el día siguiente al fin de la membresía vigente más lejana', async () => {
    const prisma = createPrismaMock();
    setupMembershipCreation(prisma);
    prisma.membership.findFirst.mockResolvedValue({
      id: 'membership-existing',
      endDate: parseDateKey('2026-11-10'),
    });
    prisma.membership.create.mockResolvedValue({
      id: 'membership-2',
      member,
      plan,
      payments: [],
    });

    const service = createService(prisma);

    await service.create('gym-1', {
      memberId: member.id,
      planId: plan.id,
      startDate: '2026-11-01',
    });

    expect(prisma.membership.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          startDate: parseDateKey('2026-11-11'),
          endDate: parseDateKey('2026-12-10'),
        }),
      }),
    );
  });

  it('respeta una fecha de inicio posterior al fin de la membresía vigente', async () => {
    const prisma = createPrismaMock();
    setupMembershipCreation(prisma);
    prisma.membership.findFirst.mockResolvedValue({
      id: 'membership-existing',
      endDate: parseDateKey('2026-11-10'),
    });
    prisma.membership.create.mockResolvedValue({
      id: 'membership-2',
      member,
      plan,
      payments: [],
    });

    const service = createService(prisma);

    await service.create('gym-1', {
      memberId: member.id,
      planId: plan.id,
      startDate: '2026-12-01',
    });

    expect(prisma.membership.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          startDate: parseDateKey('2026-12-01'),
          endDate: parseDateKey('2026-12-30'),
        }),
      }),
    );
  });

  it('rechaza socios inactivos', async () => {
    const prisma = createPrismaMock();
    prisma.member.findFirst.mockResolvedValue(null);

    const service = createService(prisma);

    await expect(
      service.create('gym-1', {
        memberId: member.id,
        planId: plan.id,
        startDate: '2026-11-01',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rechaza planes inactivos', async () => {
    const prisma = createPrismaMock();
    prisma.member.findFirst.mockResolvedValue(member);
    prisma.plan.findFirst.mockResolvedValue(null);

    const service = createService(prisma);

    await expect(
      service.create('gym-1', {
        memberId: member.id,
        planId: plan.id,
        startDate: '2026-11-01',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('MembershipsService.cancel', () => {
  it('exige un motivo de cancelación', async () => {
    const service = createService(createPrismaMock());

    await expect(
      service.cancel('gym-1', 'membership-1', {
        reason: '   ',
      }),
    ).rejects.toThrow('El motivo de la cancelación es obligatorio.');
  });

  it('no permite cancelar dos veces la misma membresía', async () => {
    const prisma = createPrismaMock();
    prisma.membership.findFirst.mockResolvedValue({
      id: 'membership-1',
      status: 'CANCELLED',
      cancelledAt: new Date(),
      payments: [],
    });

    const service = createService(prisma);

    await expect(
      service.cancel('gym-1', 'membership-1', {
        reason: 'Duplicado',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.membership.update).not.toHaveBeenCalled();
  });

  it('registra la cancelación con su motivo y fecha', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-10-30T15:00:00.000Z'));

    const prisma = createPrismaMock();
    prisma.membership.findFirst.mockResolvedValue({
      id: 'membership-1',
      status: 'ACTIVE',
      cancelledAt: null,
      payments: [],
    });
    prisma.membership.update.mockResolvedValue({
      id: 'membership-1',
      status: 'CANCELLED',
      payments: [],
    });

    const service = createService(prisma);

    await service.cancel('gym-1', 'membership-1', {
      reason: '  Cambio de plan  ',
    });

    expect(prisma.membership.update).toHaveBeenCalledWith({
      where: {
        id: 'membership-1',
      },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date('2026-10-30T15:00:00.000Z'),
        cancellationReason: 'Cambio de plan',
      },
      include: expect.any(Object),
    });

    jest.useRealTimers();
  });
});
