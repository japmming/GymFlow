import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  formatMoney,
  roundMoney,
  withPaymentSummary,
} from '../common/payment-summary';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { ReversePaymentDto } from './dto/reverse-payment.dto';

const paymentInclude = {
  member: true,
  membership: {
    include: {
      plan: true,
    },
  },
} satisfies Prisma.PaymentInclude;

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(gymId: string) {
    return this.prisma.payment.findMany({
      where: {
        gymId,
      },
      include: paymentInclude,
      orderBy: [
        {
          paymentDate: 'desc',
        },
        {
          createdAt: 'desc',
        },
      ],
    });
  }

  async findOne(gymId: string, id: string) {
    const payment = await this.prisma.payment.findFirst({
      where: {
        id,
        gymId,
      },
      include: paymentInclude,
    });

    if (!payment) {
      throw new NotFoundException('El pago no existe.');
    }

    return payment;
  }

  async create(gymId: string, dto: CreatePaymentDto) {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        return await this.prisma.$transaction(
          async (transaction) => {
            const membership = await transaction.membership.findFirst({
              where: {
                id: dto.membershipId,
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
              throw new NotFoundException('La membresía no existe.');
            }

            if (membership.member.status !== 'ACTIVE') {
              throw new BadRequestException('El miembro está inactivo.');
            }

            if (membership.status === 'CANCELLED') {
              throw new BadRequestException(
                'No se pueden registrar pagos en una membresía cancelada.',
              );
            }

            const summary = withPaymentSummary(membership);
            const amount = roundMoney(dto.amount);

            if (amount <= 0) {
              throw new BadRequestException(
                'El monto del pago debe ser mayor a cero.',
              );
            }

            if (summary.balance <= 0) {
              throw new BadRequestException(
                'La membresía no tiene saldo pendiente.',
              );
            }

            if (amount > summary.balance) {
              throw new BadRequestException(
                `El monto supera el saldo pendiente de S/ ${formatMoney(
                  summary.balance,
                )}.`,
              );
            }

            const paymentDate = dto.paymentDate
              ? new Date(dto.paymentDate)
              : new Date();

            if (Number.isNaN(paymentDate.getTime())) {
              throw new BadRequestException('La fecha del pago no es válida.');
            }

            return transaction.payment.create({
              data: {
                gymId,
                memberId: membership.memberId,
                membershipId: membership.id,
                amount,
                paymentDate,
                method: dto.method,
                reference: dto.reference?.trim() || null,
                notes: dto.notes?.trim() || null,
              },
              include: paymentInclude,
            });
          },
          {
            isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          },
        );
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2034' &&
          attempt === 0
        ) {
          continue;
        }

        throw error;
      }
    }

    throw new BadRequestException(
      'No se pudo registrar el pago. Inténtalo nuevamente.',
    );
  }

  async reverse(gymId: string, id: string, dto: ReversePaymentDto) {
    const reason = dto.reason.trim();

    if (!reason) {
      throw new BadRequestException('El motivo del reverso es obligatorio.');
    }

    const payment = await this.prisma.payment.findFirst({
      where: {
        id,
        gymId,
      },
    });

    if (!payment) {
      throw new NotFoundException('El pago no existe.');
    }

    if (payment.status === 'REFUNDED') {
      throw new BadRequestException('El pago ya fue reversado.');
    }

    return this.prisma.payment.update({
      where: {
        id: payment.id,
      },
      data: {
        status: 'REFUNDED',
        reversedAt: new Date(),
        reversalReason: reason,
      },
      include: paymentInclude,
    });
  }
}
