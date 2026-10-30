import { Injectable } from '@nestjs/common';

import {
  addDaysToDateKey,
  dateToDateKey,
  parseDateKey,
  todayDateKey,
} from '../common/date.utils';
import { getGymTimezone } from '../common/gym-timezone';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(gymId: string) {
    const timezone = await getGymTimezone(this.prisma, gymId);
    const todayKey = todayDateKey(timezone);
    const today = parseDateKey(todayKey);
    const last7DaysStartKey = addDaysToDateKey(todayKey, -6);
    const last7DaysStart = parseDateKey(last7DaysStartKey);
    const monthStart = parseDateKey(`${todayKey.slice(0, 7)}-01`);
    const expiringLimit = parseDateKey(addDaysToDateKey(todayKey, 7));

    const [
      totalMembers,
      activeMembers,
      inactiveMembers,
      activeMemberships,
      expiringMemberships,
      expiredMembers,
      recentMembers,
      todayAttendances,
      uniqueMembersToday,
      last7DaysAttendances,
      monthAttendances,
      recentAttendances,
    ] = await Promise.all([
      this.prisma.member.count({
        where: {
          gymId,
        },
      }),

      this.prisma.member.count({
        where: {
          gymId,
          status: 'ACTIVE',
        },
      }),

      this.prisma.member.count({
        where: {
          gymId,
          status: 'INACTIVE',
        },
      }),

      this.prisma.membership.count({
        where: {
          gymId,
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
      }),

      this.prisma.membership.findMany({
        where: {
          gymId,
          status: 'ACTIVE',
          startDate: {
            lte: today,
          },
          endDate: {
            gte: today,
            lte: expiringLimit,
          },
          member: {
            is: {
              status: 'ACTIVE',
            },
          },
        },
        include: {
          member: true,
          plan: true,
        },
        orderBy: {
          endDate: 'asc',
        },
        take: 10,
      }),

      this.prisma.member.count({
        where: {
          gymId,
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
      }),

      this.prisma.member.findMany({
        where: {
          gymId,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 5,
      }),

      this.prisma.attendance.count({
        where: {
          gymId,
          attendanceDate: today,
          cancelled: false,
        },
      }),

      this.prisma.attendance.groupBy({
        by: ['memberId'],
        where: {
          gymId,
          attendanceDate: today,
          cancelled: false,
        },
      }),

      this.prisma.attendance.findMany({
        where: {
          gymId,
          attendanceDate: {
            gte: last7DaysStart,
            lte: today,
          },
          cancelled: false,
        },
        select: {
          attendanceDate: true,
        },
      }),

      this.prisma.attendance.count({
        where: {
          gymId,
          attendanceDate: {
            gte: monthStart,
            lte: today,
          },
          cancelled: false,
        },
      }),

      this.prisma.attendance.findMany({
        where: {
          gymId,
          cancelled: false,
        },
        include: {
          member: true,
          membership: {
            include: {
              plan: true,
            },
          },
        },
        orderBy: {
          checkedInAt: 'desc',
        },
        take: 8,
      }),
    ]);

    return {
      members: {
        total: totalMembers,
        active: activeMembers,
        inactive: inactiveMembers,
      },

      memberships: {
        active: activeMemberships,
        expiringSoon: expiringMemberships.length,
        expired: expiredMembers,
      },

      expiringMemberships,

      recentMembers,

      attendance: {
        today: todayAttendances,
        uniqueMembersToday: uniqueMembersToday.length,
        last7Days: last7DaysAttendances.length,
        month: monthAttendances,
        daily: buildDailyAttendance(last7DaysStartKey, last7DaysAttendances),
        recent: recentAttendances,
      },
    };
  }
}

function buildDailyAttendance(
  startDateKey: string,
  attendances: { attendanceDate: Date }[],
) {
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = addDaysToDateKey(startDateKey, index);

    return {
      date,
      count: 0,
    };
  });

  const byDate = new Map(days.map((day) => [day.date, day]));

  for (const attendance of attendances) {
    const key = dateToDateKey(attendance.attendanceDate);

    const day = byDate.get(key);

    if (day) {
      day.count += 1;
    }
  }

  return days;
}
