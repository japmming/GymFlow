import { parseDateKey } from '../common/date.utils';
import type { PrismaService } from '../prisma/prisma.service';
import { DashboardService } from './dashboard.service';

interface PrismaMock {
  gym: {
    findFirst: jest.Mock;
  };
  member: {
    count: jest.Mock;
    findMany: jest.Mock;
  };
  membership: {
    count: jest.Mock;
    findMany: jest.Mock;
  };
  attendance: {
    count: jest.Mock;
    groupBy: jest.Mock;
    findMany: jest.Mock;
  };
}

function createPrismaMock(): PrismaMock {
  return {
    gym: {
      findFirst: jest.fn(),
    },
    member: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    membership: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    attendance: {
      count: jest.fn(),
      groupBy: jest.fn(),
      findMany: jest.fn(),
    },
  };
}

describe('DashboardService.getSummary', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-10-30T15:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('calcula los indicadores y el histórico de siete días', async () => {
    const prisma = createPrismaMock();
    const today = parseDateKey('2026-10-30');
    const expiringLimit = parseDateKey('2026-11-06');
    const last7DaysStart = parseDateKey('2026-10-24');
    const monthStart = parseDateKey('2026-10-01');

    const expiringMemberships = [
      {
        id: 'membership-expiring',
        endDate: parseDateKey('2026-11-02'),
      },
    ];
    const recentMembers = [{ id: 'member-recent' }];
    const recentAttendances = [{ id: 'attendance-recent' }];

    prisma.gym.findFirst.mockResolvedValue({
      timezone: 'America/Lima',
    });

    prisma.member.count
      .mockResolvedValueOnce(13)
      .mockResolvedValueOnce(11)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(5);

    prisma.membership.count.mockResolvedValue(6);
    prisma.membership.findMany.mockResolvedValue(expiringMemberships);
    prisma.member.findMany.mockResolvedValue(recentMembers);

    prisma.attendance.count.mockResolvedValueOnce(6).mockResolvedValueOnce(20);

    prisma.attendance.groupBy.mockResolvedValue([
      { memberId: 'member-1' },
      { memberId: 'member-2' },
    ]);

    prisma.attendance.findMany
      .mockResolvedValueOnce([
        { attendanceDate: parseDateKey('2026-10-29') },
        { attendanceDate: parseDateKey('2026-10-30') },
        { attendanceDate: parseDateKey('2026-10-30') },
        { attendanceDate: parseDateKey('2026-10-20') },
      ])
      .mockResolvedValueOnce(recentAttendances);

    const service = new DashboardService(prisma as unknown as PrismaService);

    const result = await service.getSummary('gym-1');

    expect(prisma.gym.findFirst).toHaveBeenCalledWith({
      where: { id: 'gym-1' },
      select: { timezone: true },
    });

    expect(prisma.member.count).toHaveBeenNthCalledWith(4, {
      where: {
        gymId: 'gym-1',
        status: 'ACTIVE',
        memberships: {
          none: {
            status: 'ACTIVE',
            endDate: {
              gte: today,
            },
          },
        },
      },
    });

    expect(prisma.membership.count).toHaveBeenCalledWith({
      where: {
        gymId: 'gym-1',
        status: 'ACTIVE',
        startDate: {
          lte: today,
        },
        endDate: {
          gte: today,
        },
        member: {
          is: {
            status: 'ACTIVE',
          },
        },
      },
    });

    expect(prisma.membership.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          startDate: { lte: today },
          endDate: {
            gte: today,
            lte: expiringLimit,
          },
        }),
      }),
    );

    expect(prisma.attendance.count).toHaveBeenNthCalledWith(1, {
      where: {
        gymId: 'gym-1',
        attendanceDate: today,
        cancelled: false,
      },
    });

    expect(prisma.attendance.count).toHaveBeenNthCalledWith(2, {
      where: {
        gymId: 'gym-1',
        attendanceDate: {
          gte: monthStart,
          lte: today,
        },
        cancelled: false,
      },
    });

    expect(prisma.attendance.findMany).toHaveBeenNthCalledWith(1, {
      where: {
        gymId: 'gym-1',
        attendanceDate: {
          gte: last7DaysStart,
          lte: today,
        },
        cancelled: false,
      },
      select: {
        attendanceDate: true,
      },
    });

    expect(result.members).toEqual({
      total: 13,
      active: 11,
      inactive: 2,
    });

    expect(result.memberships).toEqual({
      active: 6,
      expiringSoon: 1,
      expired: 5,
    });

    expect(result.expiringMemberships).toBe(expiringMemberships);
    expect(result.recentMembers).toBe(recentMembers);

    expect(result.attendance).toEqual({
      today: 6,
      uniqueMembersToday: 2,
      last7Days: 4,
      month: 20,
      daily: [
        { date: '2026-10-24', count: 0 },
        { date: '2026-10-25', count: 0 },
        { date: '2026-10-26', count: 0 },
        { date: '2026-10-27', count: 0 },
        { date: '2026-10-28', count: 0 },
        { date: '2026-10-29', count: 1 },
        { date: '2026-10-30', count: 2 },
      ],
      recent: recentAttendances,
    });
  });
});
