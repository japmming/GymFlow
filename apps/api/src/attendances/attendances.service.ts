import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { parseDateKey, todayDateKey } from '../common/date.utils';
import { getGymTimezone } from '../common/gym-timezone';
import { withPaymentSummary } from '../common/payment-summary';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CancelAttendanceDto } from './dto/cancel-attendance.dto';
import { CheckInDto } from './dto/check-in.dto';
import { QueryAttendanceDto } from './dto/query-attendance.dto';

const attendanceInclude = {
  member: true,
  membership: {
    include: {
      plan: true,
    },
  },
} satisfies Prisma.AttendanceInclude;

@Injectable()
export class AttendancesService {
  constructor(private readonly prisma: PrismaService) {}

  async checkIn(gymId: string, dto: CheckInDto) {
    const memberCode = dto.memberCode?.trim().toUpperCase();

    if (dto.qrToken && memberCode) {
      throw new BadRequestException(
        'Envía solo una opción: código QR o código de socio.',
      );
    }

    const lookup = dto.qrToken
      ? { qrToken: dto.qrToken }
      : memberCode
        ? { memberCode }
        : null;

    if (!lookup) {
      throw new BadRequestException(
        'Debes enviar un código QR o un código de socio.',
      );
    }

    const member = await this.prisma.member.findFirst({
      where: {
        gymId,
        ...lookup,
      },
    });

    if (!member) {
      throw new NotFoundException(
        dto.qrToken
          ? 'El código QR no es válido.'
          : 'El código de socio no es válido.',
      );
    }

    if (member.status !== 'ACTIVE') {
      throw new BadRequestException('El miembro está inactivo.');
    }

    const timezone = await getGymTimezone(this.prisma, gymId);
    const todayKey = todayDateKey(timezone);
    const today = parseDateKey(todayKey);

    const membership = await this.prisma.membership.findFirst({
      where: {
        gymId,
        memberId: member.id,
        status: 'ACTIVE',
        startDate: {
          lte: today,
        },
        endDate: {
          gte: today,
        },
      },
      orderBy: {
        endDate: 'desc',
      },
      include: {
        plan: true,
        payments: {
          select: {
            amount: true,
            status: true,
          },
        },
      },
    });

    if (!membership) {
      throw new BadRequestException(
        'El miembro no tiene una membresía vigente.',
      );
    }

    const membershipSummary = withPaymentSummary(membership);

    if (membershipSummary.paidAmount <= 0) {
      throw new BadRequestException(
        'La membresía no tiene pagos registrados. Registra al menos un pago para permitir el ingreso.',
      );
    }

    const alreadyCheckedInToday = await this.prisma.attendance.findFirst({
      where: {
        gymId,
        memberId: member.id,
        attendanceDate: today,
        cancelled: false,
      },
      orderBy: {
        checkedInAt: 'desc',
      },
    });

    if (alreadyCheckedInToday) {
      throw new ConflictException(
        'El miembro ya registró su asistencia el día de hoy.',
      );
    }

    try {
      const attendance = await this.prisma.attendance.create({
        data: {
          gymId,
          memberId: member.id,
          membershipId: membership.id,
          attendanceDate: today,
          source: dto.qrToken ? 'QR' : 'MEMBER_CODE',
          activeKey: 'ACTIVE',
        },
        include: {
          ...attendanceInclude,
          membership: {
            include: {
              plan: true,
              payments: {
                select: {
                  amount: true,
                  status: true,
                },
              },
            },
          },
        },
      });

      return {
        ...attendance,
        membership: attendance.membership
          ? withPaymentSummary(attendance.membership)
          : null,
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'El miembro ya registró su asistencia el día de hoy.',
        );
      }

      throw error;
    }
  }

  async cancel(gymId: string, id: string, dto: CancelAttendanceDto) {
    const reason = dto.reason.trim();

    if (!reason) {
      throw new BadRequestException(
        'El motivo de la anulación es obligatorio.',
      );
    }

    const attendance = await this.prisma.attendance.findFirst({
      where: {
        id,
        gymId,
      },
    });

    if (!attendance) {
      throw new NotFoundException('La asistencia no existe.');
    }

    if (attendance.cancelled) {
      throw new BadRequestException('La asistencia ya está anulada.');
    }

    return this.prisma.attendance.update({
      where: {
        id: attendance.id,
      },
      data: {
        cancelled: true,
        activeKey: null,
        cancelledAt: new Date(),
        cancellationReason: reason,
      },
      include: attendanceInclude,
    });
  }

  async restore(gymId: string, id: string) {
    const attendance = await this.prisma.attendance.findFirst({
      where: {
        id,
        gymId,
      },
    });

    if (!attendance) {
      throw new NotFoundException('La asistencia no existe.');
    }

    if (!attendance.cancelled) {
      throw new BadRequestException('La asistencia no está anulada.');
    }

    const activeAttendance = await this.prisma.attendance.findFirst({
      where: {
        gymId,
        memberId: attendance.memberId,
        attendanceDate: attendance.attendanceDate,
        cancelled: false,
        id: {
          not: attendance.id,
        },
      },
    });

    if (activeAttendance) {
      throw new ConflictException(
        'El miembro ya tiene una asistencia activa para ese día.',
      );
    }

    try {
      return await this.prisma.attendance.update({
        where: {
          id: attendance.id,
        },
        data: {
          cancelled: false,
          activeKey: 'ACTIVE',
          cancelledAt: null,
          cancellationReason: null,
        },
        include: attendanceInclude,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'El miembro ya tiene una asistencia activa para ese día.',
        );
      }

      throw error;
    }
  }

  async findAll(gymId: string, query: QueryAttendanceDto) {
    const { from, to, search, page = 1, limit = 20 } = query;

    const skip = (page - 1) * limit;

    const fromDate = from ? parseQueryDate(from, 'desde') : null;
    const toDate = to ? parseQueryDate(to, 'hasta') : null;

    if (fromDate && toDate && fromDate.getTime() > toDate.getTime()) {
      throw new BadRequestException(
        'La fecha "desde" no puede ser mayor que la fecha "hasta".',
      );
    }

    const searchTerms = search?.trim().split(/\s+/).filter(Boolean) ?? [];

    const where = {
      gymId,
      ...(fromDate || toDate
        ? {
            attendanceDate: {
              ...(fromDate ? { gte: fromDate } : {}),
              ...(toDate ? { lte: toDate } : {}),
            },
          }
        : {}),
      ...(searchTerms.length > 0
        ? {
            member: {
              is: {
                AND: searchTerms.map(buildMemberSearchTerm),
              },
            },
          }
        : {}),
    };

    const [attendances, total] = await Promise.all([
      this.prisma.attendance.findMany({
        where,
        include: attendanceInclude,
        orderBy: {
          checkedInAt: 'desc',
        },
        skip,
        take: limit,
      }),

      this.prisma.attendance.count({
        where,
      }),
    ]);

    return {
      data: attendances,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

function buildMemberSearchTerm(term: string) {
  return {
    OR: [
      {
        firstName: {
          contains: term,
          mode: 'insensitive' as const,
        },
      },
      {
        lastName: {
          contains: term,
          mode: 'insensitive' as const,
        },
      },
      {
        documentNumber: {
          contains: term,
          mode: 'insensitive' as const,
        },
      },
      {
        memberCode: {
          contains: term,
          mode: 'insensitive' as const,
        },
      },
    ],
  };
}

function parseQueryDate(value: string, label: 'desde' | 'hasta'): Date {
  try {
    return parseDateKey(value);
  } catch {
    throw new BadRequestException(`La fecha "${label}" no es válida.`);
  }
}
