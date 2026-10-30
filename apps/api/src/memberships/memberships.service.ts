import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  addDaysToDateKey,
  compareDateKeys,
  parseDateKey,
  todayDateKey,
} from '../common/date.utils';
import { getGymTimezone } from '../common/gym-timezone';
import { withPaymentSummary } from '../common/payment-summary';
import { PrismaService } from '../prisma/prisma.service';

import { CancelMembershipDto } from './dto/cancel-membership.dto';
import { CreateMembershipDto } from './dto/create-membership.dto';

@Injectable()
export class MembershipsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(gymId: string) {
    const memberships = await this.prisma.membership.findMany({
      where: {
        gymId,
      },
      include: {
        member: true,
        plan: true,
        payments: {
          select: {
            amount: true,
            status: true,
          },
        },
      },
      orderBy: {
        endDate: 'asc',
      },
    });

    return memberships.map(withPaymentSummary);
  }

  async findOne(gymId: string, id: string) {
    const membership = await this.prisma.membership.findFirst({
      where: {
        id,
        gymId,
      },
      include: {
        member: true,
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
      throw new NotFoundException('Membresía no encontrada');
    }

    return withPaymentSummary(membership);
  }

  async create(gymId: string, dto: CreateMembershipDto) {
    const member = await this.prisma.member.findFirst({
      where: {
        id: dto.memberId,
        gymId,
        status: 'ACTIVE',
      },
    });

    if (!member) {
      throw new NotFoundException('El miembro no existe o está inactivo.');
    }

    const plan = await this.prisma.plan.findFirst({
      where: {
        id: dto.planId,
        gymId,
        active: true,
      },
    });

    if (!plan) {
      throw new NotFoundException('El plan no existe o está inactivo.');
    }

    if (plan.durationDays < 1) {
      throw new BadRequestException('La duración del plan no es válida.');
    }

    let requestedStart: Date;

    try {
      requestedStart = parseDateKey(dto.startDate);
    } catch {
      throw new BadRequestException('La fecha de inicio no es válida.');
    }

    const timezone = await getGymTimezone(this.prisma, gymId);
    const todayKey = todayDateKey(timezone);
    const requestedStartKey = dto.startDate;

    if (compareDateKeys(requestedStartKey, todayKey) < 0) {
      throw new BadRequestException(
        'La fecha de inicio no puede ser anterior a hoy.',
      );
    }

    const today = parseDateKey(todayKey);

    const latestMembership = await this.prisma.membership.findFirst({
      where: {
        gymId,
        memberId: dto.memberId,
        status: {
          not: 'CANCELLED',
        },
        endDate: {
          gte: today,
        },
      },
      orderBy: {
        endDate: 'desc',
      },
    });

    let startDate = requestedStart;

    if (latestMembership) {
      const latestEndKey = latestMembership.endDate.toISOString().slice(0, 10);

      if (compareDateKeys(requestedStartKey, latestEndKey) <= 0) {
        startDate = parseDateKey(addDaysToDateKey(latestEndKey, 1));
      }
    }

    const startDateKey = startDate.toISOString().slice(0, 10);
    const endDate = parseDateKey(
      addDaysToDateKey(startDateKey, plan.durationDays - 1),
    );

    const membership = await this.prisma.membership.create({
      data: {
        gymId,
        memberId: dto.memberId,
        planId: dto.planId,
        startDate,
        endDate,
        price: plan.price,
        status: 'ACTIVE',
      },
      include: {
        member: true,
        plan: true,
        payments: {
          select: {
            amount: true,
            status: true,
          },
        },
      },
    });

    return withPaymentSummary(membership);
  }

  async cancel(gymId: string, id: string, dto: CancelMembershipDto) {
    const reason = dto.reason.trim();

    if (!reason) {
      throw new BadRequestException(
        'El motivo de la cancelación es obligatorio.',
      );
    }

    const membership = await this.prisma.membership.findFirst({
      where: {
        id,
        gymId,
      },
      include: {
        member: true,
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
      throw new NotFoundException('Membresía no encontrada');
    }

    if (membership.status === 'CANCELLED' || membership.cancelledAt) {
      throw new BadRequestException('La membresía ya está cancelada.');
    }

    const cancelledMembership = await this.prisma.membership.update({
      where: {
        id: membership.id,
      },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancellationReason: reason,
      },
      include: {
        member: true,
        plan: true,
        payments: {
          select: {
            amount: true,
            status: true,
          },
        },
      },
    });

    return withPaymentSummary(cancelledMembership);
  }
}
