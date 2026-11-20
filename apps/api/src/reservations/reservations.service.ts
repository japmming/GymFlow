import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  EventStatus,
  MemberStatus,
  MembershipStatus,
  PaymentStatus,
  Prisma,
  ReservationPaymentStatus,
  ReservationStatus,
} from '../generated/prisma/client';

import { PrismaService } from '../prisma/prisma.service';

import { CreateReservationDto } from './dto/create-reservation.dto';
import { QueryReservationDto } from './dto/query-reservation.dto';
import { CreateEventPaymentDto } from './dto/create-event-payment.dto';

@Injectable()
export class ReservationsService {
  constructor(private readonly prisma: PrismaService) {}

  // =====================================================
  // CREAR RESERVA
  // =====================================================

  async create(gymId: string, dto: CreateReservationDto) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        // Bloqueamos el evento para evitar sobreventa de cupos.
        const lockedEvents = await tx.$queryRaw<Array<{ id: string }>>`
          SELECT "id"
          FROM "Event"
          WHERE "id" = ${dto.eventId}::uuid
            AND "gymId" = ${gymId}::uuid
          FOR UPDATE
        `;

        if (lockedEvents.length === 0) {
          throw new NotFoundException('El evento no existe.');
        }

        const event = await tx.event.findFirst({
          where: {
            id: dto.eventId,
            gymId,
          },
          include: {
            gym: {
              select: {
                timezone: true,
              },
            },
          },
        });

        if (!event) {
          throw new NotFoundException('El evento no existe.');
        }

        if (event.status !== EventStatus.PUBLISHED) {
          throw new BadRequestException('El evento no está publicado.');
        }

        if (event.endDate <= new Date()) {
          throw new BadRequestException(
            'No es posible reservar un evento que ya finalizó.',
          );
        }

        const member = await tx.member.findFirst({
          where: {
            id: dto.memberId,
            gymId,
          },
        });

        if (!member) {
          throw new NotFoundException('El socio no existe.');
        }

        if (member.status !== MemberStatus.ACTIVE) {
          throw new BadRequestException('El socio se encuentra inactivo.');
        }

        // Validar membresía cuando el evento lo requiere.
        if (event.requiresActiveMembership) {
          const eventDate = this.getDateInTimezone(
            event.startDate,
            event.gym.timezone,
          );

          const membership = await tx.membership.findFirst({
            where: {
              gymId,
              memberId: member.id,
              status: MembershipStatus.ACTIVE,
              startDate: {
                lte: eventDate,
              },
              endDate: {
                gte: eventDate,
              },
            },
          });

          if (!membership) {
            throw new BadRequestException(
              'El socio necesita una membresía activa y vigente en la fecha del evento.',
            );
          }
        }

        // Comprobar que no exista otra reserva activa.
        const existingReservation = await tx.reservation.findFirst({
          where: {
            gymId,
            eventId: event.id,
            memberId: member.id,
            status: {
              not: ReservationStatus.CANCELLED,
            },
          },
        });

        if (existingReservation) {
          throw new BadRequestException(
            'El socio ya tiene una reserva para este evento.',
          );
        }

        // Comprobar disponibilidad.
        const reservationsCount = await tx.reservation.count({
          where: {
            gymId,
            eventId: event.id,
            status: {
              not: ReservationStatus.CANCELLED,
            },
          },
        });

        if (reservationsCount >= event.capacity) {
          throw new BadRequestException(
            'El evento ya no tiene cupos disponibles.',
          );
        }

        const isFree = event.price.lessThanOrEqualTo(0);

        return tx.reservation.create({
          data: {
            gymId,
            eventId: event.id,
            memberId: member.id,
            amount: event.price,
            status: isFree
              ? ReservationStatus.CONFIRMED
              : ReservationStatus.PENDING_PAYMENT,
            paymentStatus: isFree
              ? ReservationPaymentStatus.NOT_REQUIRED
              : ReservationPaymentStatus.PENDING,
          },
          include: {
            member: true,
            event: true,
          },
        });
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new BadRequestException(
          'El socio ya tiene una reserva activa para este evento.',
        );
      }

      throw error;
    }
  }

  // =====================================================
  // LISTAR RESERVAS
  // =====================================================

  async findAll(gymId: string, query: QueryReservationDto) {
    return this.prisma.reservation.findMany({
      where: {
        gymId,
        ...(query.eventId && {
          eventId: query.eventId,
        }),
        ...(query.memberId && {
          memberId: query.memberId,
        }),
        ...(query.status && {
          status: query.status,
        }),
        ...(query.paymentStatus && {
          paymentStatus: query.paymentStatus,
        }),
      },
      include: {
        member: true,
        event: true,
        payments: {
          orderBy: {
            paymentDate: 'desc',
          },
        },
      },
      orderBy: {
        reservedAt: 'desc',
      },
    });
  }

  // =====================================================
  // OBTENER UNA RESERVA
  // =====================================================

  async findOne(gymId: string, id: string) {
    const reservation = await this.prisma.reservation.findFirst({
      where: {
        id,
        gymId,
      },
      include: {
        member: true,
        event: true,
        payments: {
          orderBy: {
            paymentDate: 'desc',
          },
        },
      },
    });

    if (!reservation) {
      throw new NotFoundException('La reserva no existe.');
    }

    return reservation;
  }

  // =====================================================
  // LISTAR RESERVAS DE UN EVENTO
  // =====================================================

  async findByEvent(gymId: string, eventId: string) {
    const event = await this.prisma.event.findFirst({
      where: {
        id: eventId,
        gymId,
      },
    });

    if (!event) {
      throw new NotFoundException('El evento no existe.');
    }

    return this.prisma.reservation.findMany({
      where: {
        gymId,
        eventId,
        status: {
          not: ReservationStatus.CANCELLED,
        },
      },
      include: {
        member: true,
        payments: true,
      },
      orderBy: {
        reservedAt: 'asc',
      },
    });
  }

  // =====================================================
  // CANCELAR RESERVA
  // =====================================================

  async cancel(gymId: string, id: string) {
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw<Array<{ id: string }>>`
        SELECT "id"
        FROM "Reservation"
        WHERE "id" = ${id}::uuid
            AND "gymId" = ${gymId}::uuid
        FOR UPDATE
        `;
      const reservation = await tx.reservation.findFirst({
        where: {
          id,
          gymId,
        },
      });

      if (!reservation) {
        throw new NotFoundException('La reserva no existe.');
      }

      if (reservation.status === ReservationStatus.CANCELLED) {
        throw new BadRequestException('La reserva ya se encuentra cancelada.');
      }

      return tx.reservation.update({
        where: {
          id: reservation.id,
        },
        data: {
          status: ReservationStatus.CANCELLED,
          cancelledAt: new Date(),
        },
        include: {
          member: true,
          event: true,
          payments: true,
        },
      });
    });
  }

  // =====================================================
  // REGISTRAR PAGO DE RESERVA
  // =====================================================

  async registerPayment(
    gymId: string,
    reservationId: string,
    dto: CreateEventPaymentDto,
  ) {
    return this.prisma.$transaction(async (tx) => {
      // Bloquear la reserva para evitar pagos simultáneos
      // que superen el saldo pendiente.
      const lockedReservations = await tx.$queryRaw<Array<{ id: string }>>`
        SELECT "id"
        FROM "Reservation"
        WHERE "id" = ${reservationId}::uuid
          AND "gymId" = ${gymId}::uuid
        FOR UPDATE
      `;

      if (lockedReservations.length === 0) {
        throw new NotFoundException('La reserva no existe.');
      }

      const reservation = await tx.reservation.findFirst({
        where: {
          id: reservationId,
          gymId,
        },
        include: {
          payments: true,
        },
      });

      if (!reservation) {
        throw new NotFoundException('La reserva no existe.');
      }

      if (reservation.status === ReservationStatus.CANCELLED) {
        throw new BadRequestException(
          'No se pueden registrar pagos en una reserva cancelada.',
        );
      }

      if (reservation.paymentStatus === ReservationPaymentStatus.NOT_REQUIRED) {
        throw new BadRequestException('Esta reserva no requiere pagos.');
      }

      if (reservation.paymentStatus === ReservationPaymentStatus.PAID) {
        throw new BadRequestException('La reserva ya se encuentra pagada.');
      }

      const paidAmount = reservation.payments
        .filter((payment) => payment.status === PaymentStatus.COMPLETED)
        .reduce(
          (total, payment) => total.add(payment.amount),
          new Prisma.Decimal(0),
        );

      const balance = reservation.amount.minus(paidAmount);
      const paymentAmount = new Prisma.Decimal(dto.amount);

      if (paymentAmount.greaterThan(balance)) {
        throw new BadRequestException(
          `El importe supera el saldo pendiente de ${balance.toFixed(2)}.`,
        );
      }

      const payment = await tx.eventPayment.create({
        data: {
          gymId,
          reservationId,
          amount: paymentAmount,
          method: dto.method,
          reference: dto.reference,
          notes: dto.notes,
          status: PaymentStatus.COMPLETED,
        },
      });

      const newPaidAmount = paidAmount.add(paymentAmount);
      const isFullyPaid = newPaidAmount.greaterThanOrEqualTo(
        reservation.amount,
      );

      await tx.reservation.update({
        where: {
          id: reservation.id,
        },
        data: {
          status: isFullyPaid
            ? ReservationStatus.CONFIRMED
            : ReservationStatus.PENDING_PAYMENT,
          paymentStatus: isFullyPaid
            ? ReservationPaymentStatus.PAID
            : ReservationPaymentStatus.PARTIALLY_PAID,
          ...(isFullyPaid && {
            paidAt: new Date(),
          }),
        },
      });

      return {
        payment,
        reservation: await tx.reservation.findUnique({
          where: {
            id: reservation.id,
          },
          include: {
            member: true,
            event: true,
            payments: true,
          },
        }),
        paidAmount: newPaidAmount.toFixed(2),
        balance: reservation.amount.minus(newPaidAmount).toFixed(2),
      };
    });
  }

  // =====================================================
  // HISTORIAL DE PAGOS
  // =====================================================

  async findPayments(gymId: string, reservationId: string) {
    const reservation = await this.prisma.reservation.findFirst({
      where: {
        id: reservationId,
        gymId,
      },
      select: {
        id: true,
      },
    });

    if (!reservation) {
      throw new NotFoundException('La reserva no existe.');
    }

    return this.prisma.eventPayment.findMany({
      where: {
        gymId,
        reservationId,
      },
      orderBy: {
        paymentDate: 'desc',
      },
    });
  }

  // =====================================================
  // FECHA LOCAL DEL EVENTO
  // =====================================================

  private getDateInTimezone(date: Date, timezone: string): Date {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(date);

    const values = Object.fromEntries(
      parts.map((part) => [part.type, part.value]),
    );

    return new Date(
      Date.UTC(
        Number(values.year),
        Number(values.month) - 1,
        Number(values.day),
      ),
    );
  }
}
