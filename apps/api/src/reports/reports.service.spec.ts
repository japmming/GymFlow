import { BadRequestException } from '@nestjs/common';

import { parseDateKey } from '../common/date.utils';
import type { PrismaService } from '../prisma/prisma.service';
import { ReportsService } from './reports.service';

interface PrismaMock {
  gym: {
    findFirst: jest.Mock;
  };
  member: {
    findMany: jest.Mock;
    count: jest.Mock;
  };
  membership: {
    count: jest.Mock;
  };
  attendance: {
    findMany: jest.Mock;
    count: jest.Mock;
  };
  payment: {
    findMany: jest.Mock;
    aggregate: jest.Mock;
  };
  eventPayment: {
    findMany: jest.Mock;
    aggregate: jest.Mock;
  };
}

function createPrismaMock(): PrismaMock {
  return {
    gym: {
      findFirst: jest.fn(),
    },
    member: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    membership: {
      count: jest.fn(),
    },
    attendance: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    payment: {
      findMany: jest.fn(),
      aggregate: jest.fn(),
    },
    eventPayment: {
      findMany: jest.fn(),
      aggregate: jest.fn(),
    },
  };
}

function createService(prisma: PrismaMock): ReportsService {
  return new ReportsService(prisma as unknown as PrismaService);
}

function setupGym(prisma: PrismaMock) {
  prisma.gym.findFirst.mockResolvedValue({
    timezone: 'America/Lima',
    currency: 'PEN',
  });
}

function setupEmptyReport(prisma: PrismaMock) {
  setupGym(prisma);
  prisma.member.findMany.mockResolvedValue([]);
  prisma.member.count.mockResolvedValue(0);
  prisma.membership.count.mockResolvedValue(0);
  prisma.attendance.findMany.mockResolvedValue([]);
  prisma.attendance.count.mockResolvedValue(0);
  prisma.payment.findMany.mockResolvedValue([]);
  prisma.payment.aggregate.mockResolvedValue({ _sum: { amount: null } });
  prisma.eventPayment.findMany.mockResolvedValue([]);
  prisma.eventPayment.aggregate.mockResolvedValue({
    _sum: { amount: null },
  });
}

describe('ReportsService', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-11-22T15:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('construye el reporte del rango solicitado', async () => {
    const prisma = createPrismaMock();
    setupGym(prisma);

    prisma.member.findMany
      .mockResolvedValueOnce([
        {
          id: 'member-1',
          createdAt: new Date('2026-11-16T15:00:00.000Z'),
        },
        {
          id: 'member-2',
          createdAt: new Date('2026-11-19T15:00:00.000Z'),
        },
      ])
      .mockResolvedValueOnce([
        {
          id: 'member-3',
          deactivatedAt: new Date('2026-11-20T15:00:00.000Z'),
        },
      ]);
    prisma.member.count.mockResolvedValueOnce(4).mockResolvedValueOnce(20);

    prisma.attendance.findMany
      .mockResolvedValueOnce([
        {
          memberId: 'member-1',
          attendanceDate: parseDateKey('2026-11-16'),
          checkedInAt: new Date('2026-11-16T15:00:00.000Z'),
        },
        {
          memberId: 'member-1',
          attendanceDate: parseDateKey('2026-11-18'),
          checkedInAt: new Date('2026-11-18T23:00:00.000Z'),
        },
        {
          memberId: 'member-1',
          attendanceDate: parseDateKey('2026-11-18'),
          checkedInAt: new Date('2026-11-18T23:30:00.000Z'),
        },
      ])
      .mockResolvedValueOnce([
        {
          memberId: 'member-1',
          checkedInAt: new Date('2026-11-18T23:00:00.000Z'),
        },
      ]);
    prisma.attendance.count.mockResolvedValue(2);

    prisma.payment.findMany.mockResolvedValue([
      {
        amount: 100,
        method: 'CASH',
        paymentDate: new Date('2026-11-16T16:00:00.000Z'),
      },
    ]);
    prisma.eventPayment.findMany.mockResolvedValue([
      {
        amount: 50,
        method: 'YAPE',
        paymentDate: new Date('2026-11-20T20:00:00.000Z'),
      },
    ]);
    prisma.payment.aggregate.mockResolvedValue({
      _sum: { amount: 120 },
    });
    prisma.eventPayment.aggregate.mockResolvedValue({
      _sum: { amount: 30 },
    });
    prisma.membership.count.mockResolvedValueOnce(10).mockResolvedValueOnce(2);

    const service = createService(prisma);
    const report = await service.getReport('gym-1', {
      from: '2026-11-16',
      to: '2026-11-22',
    });

    expect(report.range).toEqual(
      expect.objectContaining({
        from: '2026-11-16',
        to: '2026-11-22',
        days: 7,
        timezone: 'America/Lima',
        currency: 'PEN',
        previous: { from: '2026-11-09', to: '2026-11-15' },
      }),
    );

    expect(report.attendance).toEqual(
      expect.objectContaining({
        total: 3,
        previous: 2,
        uniqueMembers: 1,
        averagePerDay: 0.43,
        changePercent: 50,
        peakDay: { date: '2026-11-18', count: 2 },
        peakHour: { hour: '18:00', count: 2 },
      }),
    );

    expect(report.members).toEqual(
      expect.objectContaining({
        new: 2,
        previousNew: 4,
        deactivated: 1,
        netGrowth: 1,
        active: 20,
        changePercent: -50,
      }),
    );

    expect(report.revenue).toEqual(
      expect.objectContaining({
        total: 150,
        previous: 150,
        membership: 100,
        events: 50,
        changePercent: 0,
      }),
    );

    expect(report.revenue.byMethod).toEqual([
      { method: 'CASH', amount: 100 },
      { method: 'YAPE', amount: 50 },
    ]);

    expect(report.retention).toEqual({
      cohort: 2,
      retained7Days: 1,
      retained30Days: 1,
      rate7Days: 50,
      rate30Days: 50,
      windowDays: 30,
    });

    expect(report.daily).toHaveLength(7);
    expect(report.daily[0]).toEqual({
      date: '2026-11-16',
      attendance: 1,
      newMembers: 1,
      deactivatedMembers: 0,
      revenue: 100,
    });
  });

  it('usa los últimos siete días cuando no se envía un rango', async () => {
    const prisma = createPrismaMock();
    setupEmptyReport(prisma);

    const service = createService(prisma);
    const report = await service.getReport('gym-1', {});

    expect(report.range.from).toBe('2026-11-16');
    expect(report.range.to).toBe('2026-11-22');
    expect(report.retention).toEqual({
      cohort: 0,
      retained7Days: 0,
      retained30Days: 0,
      rate7Days: 0,
      rate30Days: 0,
      windowDays: 30,
    });
    expect(report.attendance.peakDay).toBeNull();
    expect(report.attendance.peakHour).toBeNull();
  });

  it('rechaza un rango invertido', async () => {
    const prisma = createPrismaMock();
    setupGym(prisma);

    const service = createService(prisma);

    await expect(
      service.getReport('gym-1', {
        from: '2026-11-22',
        to: '2026-11-16',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rechaza una fecha imposible', async () => {
    const prisma = createPrismaMock();
    setupGym(prisma);

    const service = createService(prisma);

    await expect(
      service.getReport('gym-1', {
        from: '2026-02-30',
        to: '2026-11-22',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rechaza un rango mayor a 366 días', async () => {
    const prisma = createPrismaMock();
    setupGym(prisma);

    const service = createService(prisma);

    await expect(
      service.getReport('gym-1', {
        from: '2025-01-01',
        to: '2026-11-22',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
