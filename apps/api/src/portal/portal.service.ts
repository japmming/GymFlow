import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { AuthenticatedUser } from '../auth/authenticated-user';
import { withPaymentSummary } from '../common/payment-summary';
import { EventStatus } from '../generated/prisma/client';
import { EventsService } from '../events/events.service';
import { PrismaService } from '../prisma/prisma.service';
import { ReservationsService } from '../reservations/reservations.service';

@Injectable()
export class PortalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsService: EventsService,
    private readonly reservationsService: ReservationsService,
  ) {}

  private memberIdOf(user: AuthenticatedUser): string {
    if (!user.memberId) {
      throw new ForbiddenException(
        'Tu cuenta no está vinculada a un socio. Contacta al administrador.',
      );
    }

    return user.memberId;
  }

  private async assertMember(gymId: string, memberId: string): Promise<void> {
    const member = await this.prisma.member.findFirst({
      where: {
        id: memberId,
        gymId,
      },
      select: {
        id: true,
      },
    });

    if (!member) {
      throw new NotFoundException('Socio no encontrado.');
    }
  }

  async getProfile(user: AuthenticatedUser) {
    const memberId = this.memberIdOf(user);

    const member = await this.prisma.member.findFirst({
      where: {
        id: memberId,
        gymId: user.gymId,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        documentNumber: true,
        memberCode: true,
        phone: true,
        email: true,
        status: true,
        qrToken: true,
        createdAt: true,
      },
    });

    if (!member) {
      throw new NotFoundException('Socio no encontrado.');
    }

    const gym = await this.prisma.gym.findFirst({
      where: {
        id: user.gymId,
      },
      select: {
        name: true,
        logoUrl: true,
        timezone: true,
        currency: true,
      },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      member,
      gym,
    };
  }

  async getMembership(user: AuthenticatedUser) {
    const memberId = this.memberIdOf(user);
    await this.assertMember(user.gymId, memberId);

    const membership = await this.prisma.membership.findFirst({
      where: {
        gymId: user.gymId,
        memberId,
        status: 'ACTIVE',
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
      orderBy: {
        endDate: 'desc',
      },
    });

    return membership ? withPaymentSummary(membership) : null;
  }

  async getPayments(user: AuthenticatedUser) {
    const memberId = this.memberIdOf(user);
    await this.assertMember(user.gymId, memberId);

    return this.prisma.payment.findMany({
      where: {
        gymId: user.gymId,
        memberId,
      },
      include: {
        membership: {
          include: {
            plan: true,
          },
        },
      },
      orderBy: {
        paymentDate: 'desc',
      },
    });
  }

  async getReservations(user: AuthenticatedUser) {
    const memberId = this.memberIdOf(user);
    await this.assertMember(user.gymId, memberId);

    return this.reservationsService.findAll(user.gymId, { memberId });
  }

  async getEvents(user: AuthenticatedUser) {
    this.memberIdOf(user);

    return this.eventsService.findAll(user.gymId, {
      status: EventStatus.PUBLISHED,
      from: new Date().toISOString(),
    });
  }

  async createReservation(user: AuthenticatedUser, eventId: string) {
    const memberId = this.memberIdOf(user);
    await this.assertMember(user.gymId, memberId);

    return this.reservationsService.create(user.gymId, {
      eventId,
      memberId,
    });
  }

  async cancelReservation(user: AuthenticatedUser, id: string) {
    const memberId = this.memberIdOf(user);

    const reservation = await this.prisma.reservation.findFirst({
      where: {
        id,
        gymId: user.gymId,
      },
      select: {
        memberId: true,
      },
    });

    if (!reservation) {
      throw new NotFoundException('La reserva no existe.');
    }

    if (reservation.memberId !== memberId) {
      throw new ForbiddenException('Esta reserva no pertenece a tu cuenta.');
    }

    return this.reservationsService.cancel(user.gymId, id);
  }
}
