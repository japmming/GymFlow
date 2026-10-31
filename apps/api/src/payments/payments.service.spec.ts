import { BadRequestException, NotFoundException } from '@nestjs/common';

import type { PrismaService } from '../prisma/prisma.service';
import { PaymentMethodDto } from './dto/create-payment.dto';
import { PaymentsService } from './payments.service';

interface TransactionMock {
  membership: {
    findFirst: jest.Mock;
  };
  payment: {
    create: jest.Mock;
  };
}

interface PrismaMock {
  payment: {
    findFirst: jest.Mock;
    update: jest.Mock;
  };
  $transaction: jest.Mock;
}

const membership = {
  id: 'membership-1',
  gymId: 'gym-1',
  memberId: 'member-1',
  price: 49.9,
  status: 'ACTIVE',
  member: {
    id: 'member-1',
    status: 'ACTIVE',
  },
  plan: {
    id: 'plan-1',
    name: 'Plan Mensual',
  },
  payments: [{ amount: 30, status: 'COMPLETED' }],
};

function createPrismaMock(): {
  prisma: PrismaMock;
  transaction: TransactionMock;
} {
  const transaction: TransactionMock = {
    membership: {
      findFirst: jest.fn(),
    },
    payment: {
      create: jest.fn(),
    },
  };

  const prisma: PrismaMock = {
    payment: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  prisma.$transaction.mockImplementation(
    (callback: (client: TransactionMock) => Promise<unknown>) =>
      callback(transaction),
  );

  return { prisma, transaction };
}

function createService(prisma: PrismaMock): PaymentsService {
  return new PaymentsService(prisma as unknown as PrismaService);
}

describe('PaymentsService.create', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-10-30T15:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('registra un pago parcial dentro del saldo', async () => {
    const { prisma, transaction } = createPrismaMock();
    transaction.membership.findFirst.mockResolvedValue(membership);
    transaction.payment.create.mockResolvedValue({
      id: 'payment-1',
    });

    const service = createService(prisma);

    await service.create('gym-1', {
      membershipId: membership.id,
      amount: 19.9,
      method: PaymentMethodDto.CASH,
      reference: '  caja-01  ',
      notes: '  pago parcial  ',
    });

    expect(transaction.payment.create).toHaveBeenCalledWith({
      data: {
        gymId: 'gym-1',
        memberId: membership.memberId,
        membershipId: membership.id,
        amount: 19.9,
        paymentDate: new Date('2026-10-30T15:00:00.000Z'),
        method: PaymentMethodDto.CASH,
        reference: 'caja-01',
        notes: 'pago parcial',
      },
      include: expect.any(Object),
    });
  });

  it('impide sobrepagos', async () => {
    const { prisma, transaction } = createPrismaMock();
    transaction.membership.findFirst.mockResolvedValue(membership);

    const service = createService(prisma);

    await expect(
      service.create('gym-1', {
        membershipId: membership.id,
        amount: 20,
        method: PaymentMethodDto.CASH,
      }),
    ).rejects.toThrow('El monto supera el saldo pendiente de S/ 19.90.');

    expect(transaction.payment.create).not.toHaveBeenCalled();
  });

  it('rechaza membresías sin saldo pendiente', async () => {
    const { prisma, transaction } = createPrismaMock();
    transaction.membership.findFirst.mockResolvedValue({
      ...membership,
      payments: [{ amount: 49.9, status: 'COMPLETED' }],
    });

    const service = createService(prisma);

    await expect(
      service.create('gym-1', {
        membershipId: membership.id,
        amount: 10,
        method: PaymentMethodDto.CASH,
      }),
    ).rejects.toThrow('La membresía no tiene saldo pendiente.');
  });

  it('rechaza pagos en membresías canceladas', async () => {
    const { prisma, transaction } = createPrismaMock();
    transaction.membership.findFirst.mockResolvedValue({
      ...membership,
      status: 'CANCELLED',
    });

    const service = createService(prisma);

    await expect(
      service.create('gym-1', {
        membershipId: membership.id,
        amount: 10,
        method: PaymentMethodDto.CASH,
      }),
    ).rejects.toThrow(
      'No se pueden registrar pagos en una membresía cancelada.',
    );
  });

  it('rechaza pagos de socios inactivos', async () => {
    const { prisma, transaction } = createPrismaMock();
    transaction.membership.findFirst.mockResolvedValue({
      ...membership,
      member: {
        ...membership.member,
        status: 'INACTIVE',
      },
    });

    const service = createService(prisma);

    await expect(
      service.create('gym-1', {
        membershipId: membership.id,
        amount: 10,
        method: PaymentMethodDto.CASH,
      }),
    ).rejects.toThrow('El miembro está inactivo.');
  });

  it('rechaza montos menores o iguales a cero', async () => {
    const { prisma, transaction } = createPrismaMock();
    transaction.membership.findFirst.mockResolvedValue(membership);

    const service = createService(prisma);

    await expect(
      service.create('gym-1', {
        membershipId: membership.id,
        amount: 0,
        method: PaymentMethodDto.CASH,
      }),
    ).rejects.toThrow('El monto del pago debe ser mayor a cero.');
  });

  it('rechaza membresías inexistentes', async () => {
    const { prisma, transaction } = createPrismaMock();
    transaction.membership.findFirst.mockResolvedValue(null);

    const service = createService(prisma);

    await expect(
      service.create('gym-1', {
        membershipId: 'missing',
        amount: 10,
        method: PaymentMethodDto.CASH,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('PaymentsService.reverse', () => {
  it('exige un motivo de reverso', async () => {
    const { prisma } = createPrismaMock();
    const service = createService(prisma);

    await expect(
      service.reverse('gym-1', 'payment-1', {
        reason: '   ',
      }),
    ).rejects.toThrow('El motivo del reverso es obligatorio.');
  });

  it('rechaza pagos inexistentes', async () => {
    const { prisma } = createPrismaMock();
    prisma.payment.findFirst.mockResolvedValue(null);

    const service = createService(prisma);

    await expect(
      service.reverse('gym-1', 'payment-1', {
        reason: 'Error de caja',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('no permite reversar dos veces el mismo pago', async () => {
    const { prisma } = createPrismaMock();
    prisma.payment.findFirst.mockResolvedValue({
      id: 'payment-1',
      status: 'REFUNDED',
    });

    const service = createService(prisma);

    await expect(
      service.reverse('gym-1', 'payment-1', {
        reason: 'Duplicado',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.payment.update).not.toHaveBeenCalled();
  });

  it('registra el reverso con motivo y fecha', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-10-30T15:00:00.000Z'));

    const { prisma } = createPrismaMock();
    prisma.payment.findFirst.mockResolvedValue({
      id: 'payment-1',
      status: 'COMPLETED',
    });
    prisma.payment.update.mockResolvedValue({
      id: 'payment-1',
      status: 'REFUNDED',
    });

    const service = createService(prisma);

    await service.reverse('gym-1', 'payment-1', {
      reason: '  Error de caja  ',
    });

    expect(prisma.payment.update).toHaveBeenCalledWith({
      where: {
        id: 'payment-1',
      },
      data: {
        status: 'REFUNDED',
        reversedAt: new Date('2026-10-30T15:00:00.000Z'),
        reversalReason: 'Error de caja',
      },
      include: expect.any(Object),
    });

    jest.useRealTimers();
  });
});
