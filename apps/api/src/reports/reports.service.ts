import { BadRequestException, Injectable } from '@nestjs/common';

import {
  addDaysToDateKey,
  compareDateKeys,
  dateKeyInTimeZone,
  dateToDateKey,
  daysBetweenDateKeys,
  hourInTimeZone,
  isDateKey,
  parseDateKey,
  startOfDayInTimeZone,
  todayDateKey,
} from '../common/date.utils';
import { getGymTimezoneAndCurrency } from '../common/gym-timezone';
import { roundMoney } from '../common/payment-summary';
import { PrismaService } from '../prisma/prisma.service';
import { QueryReportDto } from './dto/query-report.dto';

const MAX_REPORT_DAYS = 366;
const RETENTION_WINDOW_DAYS = 30;

interface ReportRange {
  from: string;
  to: string;
  days: number;
  timezone: string;
  currency: string;
  previous: {
    from: string;
    to: string;
  };
}

interface AmountRecord {
  amount: unknown;
  paymentDate: Date;
  method: string;
}

interface AttendanceRecord {
  attendanceDate: Date;
  checkedInAt: Date;
  memberId: string;
}

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getReport(gymId: string, query: QueryReportDto) {
    const { timezone, currency } = await getGymTimezoneAndCurrency(
      this.prisma,
      gymId,
    );

    const range = this.resolveRange(query, timezone, currency);
    const todayKey = todayDateKey(timezone);
    const today = parseDateKey(todayKey);
    const expiringLimit = parseDateKey(addDaysToDateKey(todayKey, 30));

    const start = parseDateKey(range.from);
    const end = parseDateKey(range.to);
    const periodStart = startOfDayInTimeZone(range.from, timezone);
    const periodEnd = startOfDayInTimeZone(
      addDaysToDateKey(range.to, 1),
      timezone,
    );
    const previousStart = startOfDayInTimeZone(range.previous.from, timezone);
    const previousEnd = startOfDayInTimeZone(
      addDaysToDateKey(range.previous.to, 1),
      timezone,
    );
    const retentionEnd = startOfDayInTimeZone(
      addDaysToDateKey(range.to, RETENTION_WINDOW_DAYS + 1),
      timezone,
    );

    const [
      newMembers,
      deactivatedMembers,
      previousNewMembers,
      attendances,
      previousAttendances,
      membershipPayments,
      eventPayments,
      previousMembershipPayments,
      previousEventPayments,
      activeMemberships,
      expiringMemberships,
      activeMembers,
    ] = await Promise.all([
      this.prisma.member.findMany({
        where: {
          gymId,
          createdAt: {
            gte: periodStart,
            lt: periodEnd,
          },
        },
        select: {
          id: true,
          createdAt: true,
        },
      }),
      this.prisma.member.findMany({
        where: {
          gymId,
          deactivatedAt: {
            gte: periodStart,
            lt: periodEnd,
          },
        },
        select: {
          id: true,
          deactivatedAt: true,
        },
      }),
      this.prisma.member.count({
        where: {
          gymId,
          createdAt: {
            gte: previousStart,
            lt: previousEnd,
          },
        },
      }),
      this.prisma.attendance.findMany({
        where: {
          gymId,
          attendanceDate: {
            gte: start,
            lte: end,
          },
          cancelled: false,
        },
        select: {
          attendanceDate: true,
          checkedInAt: true,
          memberId: true,
        },
      }),
      this.prisma.attendance.count({
        where: {
          gymId,
          attendanceDate: {
            gte: parseDateKey(range.previous.from),
            lte: parseDateKey(range.previous.to),
          },
          cancelled: false,
        },
      }),
      this.prisma.payment.findMany({
        where: {
          gymId,
          status: 'COMPLETED',
          paymentDate: {
            gte: periodStart,
            lt: periodEnd,
          },
        },
        select: {
          amount: true,
          paymentDate: true,
          method: true,
        },
      }),
      this.prisma.eventPayment.findMany({
        where: {
          gymId,
          status: 'COMPLETED',
          paymentDate: {
            gte: periodStart,
            lt: periodEnd,
          },
        },
        select: {
          amount: true,
          paymentDate: true,
          method: true,
        },
      }),
      this.prisma.payment.aggregate({
        where: {
          gymId,
          status: 'COMPLETED',
          paymentDate: {
            gte: previousStart,
            lt: previousEnd,
          },
        },
        _sum: {
          amount: true,
        },
      }),
      this.prisma.eventPayment.aggregate({
        where: {
          gymId,
          status: 'COMPLETED',
          paymentDate: {
            gte: previousStart,
            lt: previousEnd,
          },
        },
        _sum: {
          amount: true,
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
      this.prisma.membership.count({
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
      }),
      this.prisma.member.count({
        where: {
          gymId,
          status: 'ACTIVE',
        },
      }),
    ]);

    const retentionAttendances = newMembers.length
      ? await this.prisma.attendance.findMany({
          where: {
            gymId,
            memberId: {
              in: newMembers.map((member) => member.id),
            },
            cancelled: false,
            checkedInAt: {
              gte: periodStart,
              lt: retentionEnd,
            },
          },
          select: {
            memberId: true,
            checkedInAt: true,
          },
        })
      : [];

    return this.buildReport({
      range,
      newMembers,
      deactivatedMembers,
      previousNewMembers,
      attendances,
      previousAttendances,
      membershipPayments,
      eventPayments,
      previousMembershipPayments,
      previousEventPayments,
      retentionAttendances,
      activeMemberships,
      expiringMemberships,
      activeMembers,
    });
  }

  private resolveRange(
    query: QueryReportDto,
    timezone: string,
    currency: string,
  ): ReportRange {
    const todayKey = todayDateKey(timezone);
    const from = query.from ?? addDaysToDateKey(todayKey, -6);
    const to = query.to ?? todayKey;

    if (!isDateKey(from) || !isDateKey(to)) {
      throw new BadRequestException(
        'Las fechas deben tener el formato YYYY-MM-DD.',
      );
    }

    try {
      parseDateKey(from);
      parseDateKey(to);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error
          ? error.message
          : 'Las fechas del reporte no son válidas.',
      );
    }

    if (compareDateKeys(from, to) > 0) {
      throw new BadRequestException(
        'La fecha de inicio no puede ser posterior a la fecha final.',
      );
    }

    const days = daysBetweenDateKeys(from, to) + 1;

    if (days > MAX_REPORT_DAYS) {
      throw new BadRequestException(
        `El reporte no puede superar los ${MAX_REPORT_DAYS} días.`,
      );
    }

    return {
      from,
      to,
      days,
      timezone,
      currency,
      previous: {
        from: addDaysToDateKey(from, -days),
        to: addDaysToDateKey(from, -1),
      },
    };
  }

  private buildReport(input: {
    range: ReportRange;
    newMembers: { id: string; createdAt: Date }[];
    deactivatedMembers: {
      id: string;
      deactivatedAt: Date | null;
    }[];
    previousNewMembers: number;
    attendances: AttendanceRecord[];
    previousAttendances: number;
    membershipPayments: AmountRecord[];
    eventPayments: AmountRecord[];
    previousMembershipPayments: {
      _sum: { amount: unknown };
    };
    previousEventPayments: {
      _sum: { amount: unknown };
    };
    retentionAttendances: {
      memberId: string;
      checkedInAt: Date;
    }[];
    activeMemberships: number;
    expiringMemberships: number;
    activeMembers: number;
  }) {
    const {
      range,
      newMembers,
      deactivatedMembers,
      previousNewMembers,
      attendances,
      previousAttendances,
      membershipPayments,
      eventPayments,
      previousMembershipPayments,
      previousEventPayments,
      retentionAttendances,
      activeMemberships,
      expiringMemberships,
      activeMembers,
    } = input;

    const membershipRevenue = sumAmounts(membershipPayments);
    const eventRevenue = sumAmounts(eventPayments);
    const totalRevenue = roundMoney(membershipRevenue + eventRevenue);
    const previousRevenue = roundMoney(
      Number(previousMembershipPayments._sum.amount ?? 0) +
        Number(previousEventPayments._sum.amount ?? 0),
    );

    const daily = this.buildDailySeries(
      range,
      newMembers,
      deactivatedMembers,
      attendances,
      [...membershipPayments, ...eventPayments],
    );

    const peakDay = [...daily]
      .filter((day) => day.attendance > 0)
      .sort(
        (left, right) =>
          right.attendance - left.attendance ||
          compareDateKeys(left.date, right.date),
      )[0];

    const peakHours = this.buildPeakHours(attendances, range.timezone);

    const retention = this.buildRetention(newMembers, retentionAttendances);

    const uniqueMembers = new Set(
      attendances.map((attendance) => attendance.memberId),
    ).size;

    return {
      range: {
        from: range.from,
        to: range.to,
        days: range.days,
        timezone: range.timezone,
        currency: range.currency,
        previous: range.previous,
      },

      attendance: {
        total: attendances.length,
        previous: previousAttendances,
        uniqueMembers,
        averagePerDay: roundMoney(attendances.length / range.days),
        changePercent: percentageChange(
          attendances.length,
          previousAttendances,
        ),
        peakDay: peakDay
          ? { date: peakDay.date, count: peakDay.attendance }
          : null,
        peakHour: peakHours[0] ?? null,
      },

      members: {
        new: newMembers.length,
        previousNew: previousNewMembers,
        deactivated: deactivatedMembers.length,
        netGrowth: newMembers.length - deactivatedMembers.length,
        active: activeMembers,
        changePercent: percentageChange(newMembers.length, previousNewMembers),
      },

      memberships: {
        active: activeMemberships,
        expiringSoon: expiringMemberships,
      },

      revenue: {
        total: totalRevenue,
        previous: previousRevenue,
        membership: membershipRevenue,
        events: eventRevenue,
        changePercent: percentageChange(totalRevenue, previousRevenue),
        byMethod: buildPaymentMethods([
          ...membershipPayments,
          ...eventPayments,
        ]),
      },

      retention,

      daily,
      peakHours,
    };
  }

  private buildDailySeries(
    range: ReportRange,
    newMembers: { createdAt: Date }[],
    deactivatedMembers: { deactivatedAt: Date | null }[],
    attendances: AttendanceRecord[],
    payments: AmountRecord[],
  ) {
    const days = Array.from({ length: range.days }, (_, index) => {
      const date = addDaysToDateKey(range.from, index);

      return {
        date,
        attendance: 0,
        newMembers: 0,
        deactivatedMembers: 0,
        revenue: 0,
      };
    });

    const byDate = new Map(days.map((day) => [day.date, day]));

    for (const attendance of attendances) {
      const key = dateToDateKey(attendance.attendanceDate);
      const day = byDate.get(key);

      if (day) {
        day.attendance += 1;
      }
    }

    for (const member of newMembers) {
      const key = dateKeyInTimeZone(member.createdAt, range.timezone);
      const day = byDate.get(key);

      if (day) {
        day.newMembers += 1;
      }
    }

    for (const member of deactivatedMembers) {
      if (!member.deactivatedAt) {
        continue;
      }

      const key = dateKeyInTimeZone(member.deactivatedAt, range.timezone);
      const day = byDate.get(key);

      if (day) {
        day.deactivatedMembers += 1;
      }
    }

    for (const payment of payments) {
      const key = dateKeyInTimeZone(payment.paymentDate, range.timezone);
      const day = byDate.get(key);

      if (day) {
        day.revenue = roundMoney(day.revenue + Number(payment.amount));
      }
    }

    return days;
  }

  private buildPeakHours(attendances: AttendanceRecord[], timezone: string) {
    const counts = new Map<string, number>();

    for (const attendance of attendances) {
      const hour = hourInTimeZone(attendance.checkedInAt, timezone);

      counts.set(hour, (counts.get(hour) ?? 0) + 1);
    }

    return [...counts.entries()]
      .map(([hour, count]) => ({ hour, count }))
      .sort(
        (left, right) =>
          right.count - left.count || left.hour.localeCompare(right.hour),
      )
      .slice(0, 8);
  }

  private buildRetention(
    newMembers: { id: string; createdAt: Date }[],
    attendances: { memberId: string; checkedInAt: Date }[],
  ) {
    const byMember = new Map<string, Date[]>();

    for (const attendance of attendances) {
      const dates = byMember.get(attendance.memberId) ?? [];

      dates.push(attendance.checkedInAt);
      byMember.set(attendance.memberId, dates);
    }

    const hasVisitWithin = (
      memberId: string,
      createdAt: Date,
      days: number,
    ) => {
      const limit = createdAt.getTime() + days * 86_400_000;

      return (byMember.get(memberId) ?? []).some(
        (date) =>
          date.getTime() >= createdAt.getTime() && date.getTime() <= limit,
      );
    };

    const retained7Days = newMembers.filter((member) =>
      hasVisitWithin(member.id, member.createdAt, 7),
    ).length;
    const retained30Days = newMembers.filter((member) =>
      hasVisitWithin(member.id, member.createdAt, 30),
    ).length;

    return {
      cohort: newMembers.length,
      retained7Days,
      retained30Days,
      rate7Days: rate(retained7Days, newMembers.length),
      rate30Days: rate(retained30Days, newMembers.length),
      windowDays: RETENTION_WINDOW_DAYS,
    };
  }
}

function sumAmounts(payments: AmountRecord[]): number {
  return roundMoney(
    payments.reduce((total, payment) => total + Number(payment.amount), 0),
  );
}

function buildPaymentMethods(payments: AmountRecord[]) {
  const byMethod = new Map<string, number>();

  for (const payment of payments) {
    byMethod.set(
      payment.method,
      roundMoney((byMethod.get(payment.method) ?? 0) + Number(payment.amount)),
    );
  }

  return [...byMethod.entries()]
    .map(([method, amount]) => ({ method, amount }))
    .sort((left, right) => right.amount - left.amount);
}

function percentageChange(current: number, previous: number): number | null {
  if (previous === 0) {
    return null;
  }

  return roundMoney(((current - previous) / previous) * 100);
}

function rate(part: number, total: number): number {
  if (total === 0) {
    return 0;
  }

  return roundMoney((part / total) * 100);
}
