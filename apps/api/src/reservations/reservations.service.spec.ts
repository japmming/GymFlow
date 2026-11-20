import { BadRequestException, NotFoundException } from '@nestjs/common';

import {
  EventStatus,
  MemberStatus,
  MembershipStatus,
  PaymentMethod,
  PaymentStatus,
  Prisma,
  ReservationPaymentStatus,
  ReservationStatus,
} from '../generated/prisma/client';
import type { PrismaService } from '../prisma/prisma.service';

import { ReservationsService } from './reservations.service';
import type { CreateReservationDto } from './dto/create-reservation.dto';
import type { QueryReservationDto } from './dto/query-reservation.dto';
import type { CreateEventPaymentDto } from './dto/create-event-payment.dto';

const GYM_ID = 'gym-1';
const OTHER_GYM_ID = 'gym-2';
const EVENT_ID = 'event-1';
const MEMBER_ID = 'member-1';
const RESERVATION_ID = 'reservation-1';
const NOW = new Date('2026-11-19T12:00:00.000Z');

type Overrides = Record<string, unknown>;
type Mocks = ReturnType<typeof createPrismaMock>;

function buildEvent(overrides: Overrides = {}) {
  return {
    id: EVENT_ID,
    gymId: GYM_ID,
    name: 'Clase de spinning',
    status: EventStatus.PUBLISHED,
    startDate: new Date('2026-12-01T15:00:00.000Z'),
    endDate: new Date('2026-12-01T16:00:00.000Z'),
    capacity: 10,
    price: new Prisma.Decimal('0'),
    requiresActiveMembership: false,
    gym: { timezone: 'America/Lima' },
    ...overrides,
  };
}

function buildMember(overrides: Overrides = {}) {
  return {
    id: MEMBER_ID,
    gymId: GYM_ID,
    firstName: 'Natalia',
    lastName: 'Vargas',
    status: MemberStatus.ACTIVE,
    ...overrides,
  };
}

function buildMembership(overrides: Overrides = {}) {
  return {
    id: 'membership-1',
    gymId: GYM_ID,
    memberId: MEMBER_ID,
    status: MembershipStatus.ACTIVE,
    startDate: new Date('2026-11-01T00:00:00.000Z'),
    endDate: new Date('2026-12-31T00:00:00.000Z'),
    ...overrides,
  };
}

function buildReservation(overrides: Overrides = {}) {
  return {
    id: RESERVATION_ID,
    gymId: GYM_ID,
    eventId: EVENT_ID,
    memberId: MEMBER_ID,
    amount: new Prisma.Decimal('15.00'),
    status: ReservationStatus.PENDING_PAYMENT,
    paymentStatus: ReservationPaymentStatus.PENDING,
    reservedAt: NOW,
    paidAt: null,
    cancelledAt: null,
    payments: [] as Overrides[],
    member: buildMember(),
    event: buildEvent(),
    ...overrides,
  };
}

function buildPayment(overrides: Overrides = {}) {
  return {
    id: 'payment-1',
    gymId: GYM_ID,
    reservationId: RESERVATION_ID,
    amount: new Prisma.Decimal('5.00'),
    method: PaymentMethod.YAPE,
    reference: 'YAPE-TEST-001',
    notes: null,
    status: PaymentStatus.COMPLETED,
    paymentDate: NOW,
    ...overrides,
  };
}

function createPrismaMock() {
  const tx = {
    $queryRaw: jest.fn().mockResolvedValue([{ id: 'locked-row' }]),
    event: { findFirst: jest.fn() },
    member: { findFirst: jest.fn() },
    membership: { findFirst: jest.fn() },
    reservation: {
      findFirst: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    eventPayment: {
      create: jest
        .fn()
        .mockImplementation(({ data }: { data: Overrides }) =>
          Promise.resolve(buildPayment(data)),
        ),
    },
  };

  const prisma = {
    $transaction: jest.fn(
      async (callback: (transaction: typeof tx) => Promise<unknown>) =>
        callback(tx),
    ),
    event: { findFirst: jest.fn() },
    reservation: { findMany: jest.fn(), findFirst: jest.fn() },
    eventPayment: { findMany: jest.fn() },
  };

  return { prisma, tx };
}

function createService(prisma: Mocks['prisma']): ReservationsService {
  return new ReservationsService(prisma as unknown as PrismaService);
}

function setupCreate(
  mocks: Mocks,
  options: {
    event?: Overrides;
    member?: Overrides;
    membership?: Overrides | null;
    existing?: Overrides | null;
    count?: number;
  } = {},
) {
  const event = buildEvent(options.event);
  const member = buildMember(options.member);

  mocks.tx.event.findFirst.mockResolvedValue(event);
  mocks.tx.member.findFirst.mockResolvedValue(member);
  mocks.tx.membership.findFirst.mockResolvedValue(
    options.membership === undefined ? buildMembership() : options.membership,
  );
  mocks.tx.reservation.findFirst.mockResolvedValue(options.existing ?? null);
  mocks.tx.reservation.count.mockResolvedValue(options.count ?? 0);
  mocks.tx.reservation.create.mockImplementation(
    ({ data }: { data: Overrides }) => Promise.resolve(buildReservation(data)),
  );

  return { event, member };
}

function setupPayment(mocks: Mocks, reservationOverrides: Overrides = {}) {
  const reservation = buildReservation(reservationOverrides);
  let updated = reservation;

  mocks.tx.reservation.findFirst.mockResolvedValue(reservation);
  mocks.tx.reservation.update.mockImplementation(
    ({ data }: { data: Overrides }) => {
      updated = buildReservation({ ...reservation, ...data });
      return Promise.resolve(updated);
    },
  );
  mocks.tx.reservation.findUnique.mockImplementation(() =>
    Promise.resolve(updated),
  );

  return reservation;
}

const createDto: CreateReservationDto = {
  eventId: EVENT_ID,
  memberId: MEMBER_ID,
};

const paymentDto: CreateEventPaymentDto = {
  amount: 5,
  method: PaymentMethod.YAPE,
  reference: 'YAPE-TEST-001',
};

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(NOW);
});

afterEach(() => {
  jest.useRealTimers();
});

describe('ReservationsService.create', () => {
  it('bloquea el evento y lo consulta dentro del gimnasio autenticado', async () => {
    const mocks = createPrismaMock();
    setupCreate(mocks);
    const service = createService(mocks.prisma);

    await service.create(GYM_ID, createDto);

    expect(mocks.tx.$queryRaw).toHaveBeenCalled();
    expect(mocks.tx.event.findFirst).toHaveBeenCalledWith({
      where: { id: EVENT_ID, gymId: GYM_ID },
      include: { gym: { select: { timezone: true } } },
    });
    expect(mocks.tx.member.findFirst).toHaveBeenCalledWith({
      where: { id: MEMBER_ID, gymId: GYM_ID },
    });
  });

  it('responde 404 cuando el bloqueo del evento no devuelve filas', async () => {
    const mocks = createPrismaMock();
    mocks.tx.$queryRaw.mockResolvedValue([]);
    const service = createService(mocks.prisma);

    await expect(service.create(GYM_ID, createDto)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    await expect(service.create(GYM_ID, createDto)).rejects.toThrow(
      'El evento no existe.',
    );
    expect(mocks.tx.reservation.create).not.toHaveBeenCalled();
  });

  it('responde 404 cuando el evento pertenece a otro gimnasio', async () => {
    const mocks = createPrismaMock();
    mocks.tx.event.findFirst.mockResolvedValue(null);
    const service = createService(mocks.prisma);

    await expect(
      service.create(OTHER_GYM_ID, createDto),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(mocks.tx.event.findFirst).toHaveBeenCalledWith({
      where: { id: EVENT_ID, gymId: OTHER_GYM_ID },
      include: { gym: { select: { timezone: true } } },
    });
  });

  it.each([EventStatus.DRAFT, EventStatus.CANCELLED, EventStatus.COMPLETED])(
    'rechaza un evento en estado %s',
    async (status) => {
      const mocks = createPrismaMock();
      setupCreate(mocks, { event: { status } });
      const service = createService(mocks.prisma);

      await expect(service.create(GYM_ID, createDto)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      await expect(service.create(GYM_ID, createDto)).rejects.toThrow(
        'El evento no está publicado.',
      );
      expect(mocks.tx.reservation.create).not.toHaveBeenCalled();
    },
  );

  it('rechaza un evento que ya finalizó', async () => {
    const mocks = createPrismaMock();
    setupCreate(mocks, {
      event: { endDate: new Date('2026-11-18T16:00:00.000Z') },
    });
    const service = createService(mocks.prisma);

    await expect(service.create(GYM_ID, createDto)).rejects.toThrow(
      'No es posible reservar un evento que ya finalizó.',
    );
    expect(mocks.tx.reservation.create).not.toHaveBeenCalled();
  });

  it('responde 404 cuando el socio no existe en el gimnasio', async () => {
    const mocks = createPrismaMock();
    setupCreate(mocks);
    mocks.tx.member.findFirst.mockResolvedValue(null);
    const service = createService(mocks.prisma);

    await expect(service.create(GYM_ID, createDto)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    await expect(service.create(GYM_ID, createDto)).rejects.toThrow(
      'El socio no existe.',
    );
  });

  it('rechaza socios inactivos', async () => {
    const mocks = createPrismaMock();
    setupCreate(mocks, { member: { status: MemberStatus.INACTIVE } });
    const service = createService(mocks.prisma);

    await expect(service.create(GYM_ID, createDto)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(service.create(GYM_ID, createDto)).rejects.toThrow(
      'El socio se encuentra inactivo.',
    );
  });

  it('no consulta membresías cuando el evento no la exige', async () => {
    const mocks = createPrismaMock();
    setupCreate(mocks);
    const service = createService(mocks.prisma);

    await service.create(GYM_ID, createDto);

    expect(mocks.tx.membership.findFirst).not.toHaveBeenCalled();
  });

  it('rechaza la reserva cuando no hay membresía vigente', async () => {
    const mocks = createPrismaMock();
    setupCreate(mocks, {
      event: { requiresActiveMembership: true },
      membership: null,
    });
    const service = createService(mocks.prisma);

    await expect(service.create(GYM_ID, createDto)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(service.create(GYM_ID, createDto)).rejects.toThrow(
      'El socio necesita una membresía activa y vigente en la fecha del evento.',
    );
    expect(mocks.tx.reservation.create).not.toHaveBeenCalled();
  });

  it('acepta la reserva cuando la membresía está activa y vigente', async () => {
    const mocks = createPrismaMock();
    setupCreate(mocks, { event: { requiresActiveMembership: true } });
    const service = createService(mocks.prisma);

    const result = await service.create(GYM_ID, createDto);

    expect(mocks.tx.membership.findFirst).toHaveBeenCalledWith({
      where: {
        gymId: GYM_ID,
        memberId: MEMBER_ID,
        status: MembershipStatus.ACTIVE,
        startDate: { lte: new Date('2026-12-01T00:00:00.000Z') },
        endDate: { gte: new Date('2026-12-01T00:00:00.000Z') },
      },
    });
    expect(result.status).toBe(ReservationStatus.CONFIRMED);
  });

  it('valida la vigencia con la fecha local del gimnasio', async () => {
    const mocks = createPrismaMock();
    setupCreate(mocks, {
      event: {
        requiresActiveMembership: true,
        startDate: new Date('2026-12-01T03:00:00.000Z'),
        endDate: new Date('2026-12-01T04:00:00.000Z'),
        gym: { timezone: 'America/Lima' },
      },
    });
    const service = createService(mocks.prisma);

    await service.create(GYM_ID, createDto);

    expect(mocks.tx.membership.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          startDate: { lte: new Date('2026-11-30T00:00:00.000Z') },
          endDate: { gte: new Date('2026-11-30T00:00:00.000Z') },
        }),
      }),
    );
  });

  it('rechaza una reserva duplicada activa', async () => {
    const mocks = createPrismaMock();
    setupCreate(mocks, {
      existing: {
        id: 'reservation-existing',
        status: ReservationStatus.CONFIRMED,
      },
    });
    const service = createService(mocks.prisma);

    await expect(service.create(GYM_ID, createDto)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(service.create(GYM_ID, createDto)).rejects.toThrow(
      'El socio ya tiene una reserva para este evento.',
    );
    expect(mocks.tx.reservation.create).not.toHaveBeenCalled();
  });

  it('ignora reservas canceladas al comprobar duplicados y cupos', async () => {
    const mocks = createPrismaMock();
    setupCreate(mocks, { count: 1 });
    const service = createService(mocks.prisma);

    await service.create(GYM_ID, createDto);

    expect(mocks.tx.reservation.findFirst).toHaveBeenCalledWith({
      where: {
        gymId: GYM_ID,
        eventId: EVENT_ID,
        memberId: MEMBER_ID,
        status: { not: ReservationStatus.CANCELLED },
      },
    });
    expect(mocks.tx.reservation.count).toHaveBeenCalledWith({
      where: {
        gymId: GYM_ID,
        eventId: EVENT_ID,
        status: { not: ReservationStatus.CANCELLED },
      },
    });
  });

  it('rechaza la reserva cuando el evento ya no tiene cupos', async () => {
    const mocks = createPrismaMock();
    setupCreate(mocks, { event: { capacity: 2 }, count: 2 });
    const service = createService(mocks.prisma);

    await expect(service.create(GYM_ID, createDto)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(service.create(GYM_ID, createDto)).rejects.toThrow(
      'El evento ya no tiene cupos disponibles.',
    );
    expect(mocks.tx.reservation.create).not.toHaveBeenCalled();
  });

  it('confirma de inmediato una reserva en un evento gratuito', async () => {
    const mocks = createPrismaMock();
    const { event } = setupCreate(mocks, {
      event: { price: new Prisma.Decimal('0') },
    });
    const service = createService(mocks.prisma);

    const result = await service.create(GYM_ID, createDto);

    expect(mocks.tx.reservation.create).toHaveBeenCalledWith({
      data: {
        gymId: GYM_ID,
        eventId: EVENT_ID,
        memberId: MEMBER_ID,
        amount: event.price,
        status: ReservationStatus.CONFIRMED,
        paymentStatus: ReservationPaymentStatus.NOT_REQUIRED,
      },
      include: { member: true, event: true },
    });
    expect(result.status).toBe(ReservationStatus.CONFIRMED);
    expect(result.paymentStatus).toBe(ReservationPaymentStatus.NOT_REQUIRED);
  });

  it('deja pendiente de pago una reserva en un evento de pago', async () => {
    const mocks = createPrismaMock();
    const { event } = setupCreate(mocks, {
      event: { price: new Prisma.Decimal('15.00') },
    });
    const service = createService(mocks.prisma);

    await service.create(GYM_ID, createDto);

    expect(mocks.tx.reservation.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          amount: event.price,
          status: ReservationStatus.PENDING_PAYMENT,
          paymentStatus: ReservationPaymentStatus.PENDING,
        }),
      }),
    );
  });

  it('traduce el error P2002 a un BadRequest', async () => {
    const mocks = createPrismaMock();
    setupCreate(mocks);
    mocks.tx.reservation.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '7.10.1',
      }),
    );
    const service = createService(mocks.prisma);

    await expect(service.create(GYM_ID, createDto)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(service.create(GYM_ID, createDto)).rejects.toThrow(
      'El socio ya tiene una reserva activa para este evento.',
    );
  });

  it('propaga errores inesperados', async () => {
    const mocks = createPrismaMock();
    setupCreate(mocks);
    mocks.tx.reservation.create.mockRejectedValue(
      new Error('Fallo inesperado'),
    );
    const service = createService(mocks.prisma);

    await expect(service.create(GYM_ID, createDto)).rejects.toThrow(
      'Fallo inesperado',
    );
  });
});

describe('ReservationsService.findAll', () => {
  it('lista únicamente las reservas del gimnasio autenticado', async () => {
    const mocks = createPrismaMock();
    mocks.prisma.reservation.findMany.mockResolvedValue([]);
    const service = createService(mocks.prisma);

    await service.findAll(GYM_ID, {});

    expect(mocks.prisma.reservation.findMany).toHaveBeenCalledWith({
      where: { gymId: GYM_ID },
      include: {
        member: true,
        event: true,
        payments: { orderBy: { paymentDate: 'desc' } },
      },
      orderBy: { reservedAt: 'desc' },
    });
  });

  it('aplica todos los filtros disponibles', async () => {
    const mocks = createPrismaMock();
    mocks.prisma.reservation.findMany.mockResolvedValue([]);
    const query: QueryReservationDto = {
      eventId: EVENT_ID,
      memberId: MEMBER_ID,
      status: ReservationStatus.PENDING_PAYMENT,
      paymentStatus: ReservationPaymentStatus.PARTIALLY_PAID,
    };
    const service = createService(mocks.prisma);

    await service.findAll(GYM_ID, query);

    expect(mocks.prisma.reservation.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          gymId: GYM_ID,
          eventId: EVENT_ID,
          memberId: MEMBER_ID,
          status: ReservationStatus.PENDING_PAYMENT,
          paymentStatus: ReservationPaymentStatus.PARTIALLY_PAID,
        },
      }),
    );
  });
});

describe('ReservationsService.findOne', () => {
  it('devuelve la reserva del gimnasio con socio, evento y pagos', async () => {
    const mocks = createPrismaMock();
    const reservation = buildReservation();
    mocks.prisma.reservation.findFirst.mockResolvedValue(reservation);
    const service = createService(mocks.prisma);

    const result = await service.findOne(GYM_ID, RESERVATION_ID);

    expect(mocks.prisma.reservation.findFirst).toHaveBeenCalledWith({
      where: { id: RESERVATION_ID, gymId: GYM_ID },
      include: {
        member: true,
        event: true,
        payments: { orderBy: { paymentDate: 'desc' } },
      },
    });
    expect(result).toBe(reservation);
  });

  it('responde 404 si la reserva no existe o es de otro gimnasio', async () => {
    const mocks = createPrismaMock();
    mocks.prisma.reservation.findFirst.mockResolvedValue(null);
    const service = createService(mocks.prisma);

    await expect(
      service.findOne(OTHER_GYM_ID, RESERVATION_ID),
    ).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.findOne(OTHER_GYM_ID, RESERVATION_ID)).rejects.toThrow(
      'La reserva no existe.',
    );
  });
});

describe('ReservationsService.findByEvent', () => {
  it('responde 404 cuando el evento no existe en el gimnasio', async () => {
    const mocks = createPrismaMock();
    mocks.prisma.event.findFirst.mockResolvedValue(null);
    const service = createService(mocks.prisma);

    await expect(service.findByEvent(GYM_ID, EVENT_ID)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(mocks.prisma.reservation.findMany).not.toHaveBeenCalled();
  });

  it('devuelve los inscritos activos con sus datos y pagos', async () => {
    const mocks = createPrismaMock();
    mocks.prisma.event.findFirst.mockResolvedValue(buildEvent());
    mocks.prisma.reservation.findMany.mockResolvedValue([buildReservation()]);
    const service = createService(mocks.prisma);

    const result = await service.findByEvent(GYM_ID, EVENT_ID);

    expect(mocks.prisma.event.findFirst).toHaveBeenCalledWith({
      where: { id: EVENT_ID, gymId: GYM_ID },
    });
    expect(mocks.prisma.reservation.findMany).toHaveBeenCalledWith({
      where: {
        gymId: GYM_ID,
        eventId: EVENT_ID,
        status: { not: ReservationStatus.CANCELLED },
      },
      include: { member: true, payments: true },
      orderBy: { reservedAt: 'asc' },
    });
    expect(result).toHaveLength(1);
  });
});

describe('ReservationsService.cancel', () => {
  it('bloquea la reserva antes de cancelarla', async () => {
    const mocks = createPrismaMock();
    mocks.tx.reservation.findFirst.mockResolvedValue(buildReservation());
    mocks.tx.reservation.update.mockImplementation(
      ({ data }: { data: Overrides }) =>
        Promise.resolve(buildReservation(data) as Overrides),
    );
    const service = createService(mocks.prisma);

    await service.cancel(GYM_ID, RESERVATION_ID);

    expect(mocks.tx.$queryRaw).toHaveBeenCalled();
    expect(mocks.tx.reservation.findFirst).toHaveBeenCalledWith({
      where: { id: RESERVATION_ID, gymId: GYM_ID },
    });
  });

  it('responde 404 cuando la reserva no existe', async () => {
    const mocks = createPrismaMock();
    mocks.tx.reservation.findFirst.mockResolvedValue(null);
    const service = createService(mocks.prisma);

    await expect(service.cancel(GYM_ID, RESERVATION_ID)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(mocks.tx.reservation.update).not.toHaveBeenCalled();
  });

  it('rechaza cancelar dos veces la misma reserva', async () => {
    const mocks = createPrismaMock();
    mocks.tx.reservation.findFirst.mockResolvedValue(
      buildReservation({ status: ReservationStatus.CANCELLED }),
    );
    const service = createService(mocks.prisma);

    await expect(service.cancel(GYM_ID, RESERVATION_ID)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(service.cancel(GYM_ID, RESERVATION_ID)).rejects.toThrow(
      'La reserva ya se encuentra cancelada.',
    );
    expect(mocks.tx.reservation.update).not.toHaveBeenCalled();
  });

  it('cancela la reserva, registra la fecha y libera el cupo', async () => {
    const mocks = createPrismaMock();
    mocks.tx.reservation.findFirst.mockResolvedValue(buildReservation());
    mocks.tx.reservation.update.mockResolvedValue(buildReservation());
    const service = createService(mocks.prisma);

    await service.cancel(GYM_ID, RESERVATION_ID);

    expect(mocks.tx.reservation.update).toHaveBeenCalledWith({
      where: { id: RESERVATION_ID },
      data: {
        status: ReservationStatus.CANCELLED,
        cancelledAt: NOW,
      },
      include: { member: true, event: true, payments: true },
    });
  });
});

describe('ReservationsService.registerPayment', () => {
  it('responde 404 si el bloqueo no encuentra la reserva', async () => {
    const mocks = createPrismaMock();
    mocks.tx.$queryRaw.mockResolvedValue([]);
    const service = createService(mocks.prisma);

    await expect(
      service.registerPayment(GYM_ID, RESERVATION_ID, paymentDto),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(mocks.tx.eventPayment.create).not.toHaveBeenCalled();
  });

  it('responde 404 si la reserva no existe en el gimnasio', async () => {
    const mocks = createPrismaMock();
    mocks.tx.reservation.findFirst.mockResolvedValue(null);
    const service = createService(mocks.prisma);

    await expect(
      service.registerPayment(GYM_ID, RESERVATION_ID, paymentDto),
    ).rejects.toThrow('La reserva no existe.');
  });

  it('rechaza pagos en una reserva cancelada', async () => {
    const mocks = createPrismaMock();
    setupPayment(mocks, { status: ReservationStatus.CANCELLED });
    const service = createService(mocks.prisma);

    await expect(
      service.registerPayment(GYM_ID, RESERVATION_ID, paymentDto),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.registerPayment(GYM_ID, RESERVATION_ID, paymentDto),
    ).rejects.toThrow('No se pueden registrar pagos en una reserva cancelada.');
    expect(mocks.tx.eventPayment.create).not.toHaveBeenCalled();
  });

  it('rechaza pagos en una reserva gratuita', async () => {
    const mocks = createPrismaMock();
    setupPayment(mocks, {
      status: ReservationStatus.CONFIRMED,
      paymentStatus: ReservationPaymentStatus.NOT_REQUIRED,
      amount: new Prisma.Decimal('0'),
    });
    const service = createService(mocks.prisma);

    await expect(
      service.registerPayment(GYM_ID, RESERVATION_ID, paymentDto),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.registerPayment(GYM_ID, RESERVATION_ID, paymentDto),
    ).rejects.toThrow('Esta reserva no requiere pagos.');
  });

  it('rechaza pagos adicionales una vez liquidada la reserva', async () => {
    const mocks = createPrismaMock();
    setupPayment(mocks, {
      status: ReservationStatus.CONFIRMED,
      paymentStatus: ReservationPaymentStatus.PAID,
    });
    const service = createService(mocks.prisma);

    await expect(
      service.registerPayment(GYM_ID, RESERVATION_ID, paymentDto),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.registerPayment(GYM_ID, RESERVATION_ID, paymentDto),
    ).rejects.toThrow('La reserva ya se encuentra pagada.');
  });

  it('rechaza un importe que supera el saldo pendiente', async () => {
    const mocks = createPrismaMock();
    setupPayment(mocks, {
      payments: [buildPayment({ amount: new Prisma.Decimal('5.00') })],
    });
    const service = createService(mocks.prisma);

    await expect(
      service.registerPayment(GYM_ID, RESERVATION_ID, {
        amount: 11,
        method: PaymentMethod.CASH,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.registerPayment(GYM_ID, RESERVATION_ID, {
        amount: 11,
        method: PaymentMethod.CASH,
      }),
    ).rejects.toThrow('El importe supera el saldo pendiente de 10.00.');
    expect(mocks.tx.eventPayment.create).not.toHaveBeenCalled();
  });

  it('registra un pago parcial y mantiene la reserva pendiente', async () => {
    const mocks = createPrismaMock();
    setupPayment(mocks);
    const service = createService(mocks.prisma);

    const result = await service.registerPayment(
      GYM_ID,
      RESERVATION_ID,
      paymentDto,
    );

    expect(mocks.tx.$queryRaw).toHaveBeenCalled();
    expect(mocks.tx.eventPayment.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        gymId: GYM_ID,
        reservationId: RESERVATION_ID,
        amount: new Prisma.Decimal('5'),
        method: PaymentMethod.YAPE,
        reference: 'YAPE-TEST-001',
        status: PaymentStatus.COMPLETED,
      }),
    });
    expect(mocks.tx.reservation.update).toHaveBeenCalledWith({
      where: { id: RESERVATION_ID },
      data: {
        status: ReservationStatus.PENDING_PAYMENT,
        paymentStatus: ReservationPaymentStatus.PARTIALLY_PAID,
      },
    });
    expect(result.paidAmount).toBe('5.00');
    expect(result.balance).toBe('10.00');
    expect(result.reservation?.paymentStatus).toBe(
      ReservationPaymentStatus.PARTIALLY_PAID,
    );
  });

  it('confirma la reserva cuando el pago cubre el importe total', async () => {
    const mocks = createPrismaMock();
    setupPayment(mocks);
    const service = createService(mocks.prisma);

    const result = await service.registerPayment(GYM_ID, RESERVATION_ID, {
      amount: 15,
      method: PaymentMethod.TRANSFER,
      notes: 'Pago final',
    });

    expect(mocks.tx.eventPayment.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        amount: new Prisma.Decimal('15'),
        method: PaymentMethod.TRANSFER,
        notes: 'Pago final',
      }),
    });
    expect(mocks.tx.reservation.update).toHaveBeenCalledWith({
      where: { id: RESERVATION_ID },
      data: {
        status: ReservationStatus.CONFIRMED,
        paymentStatus: ReservationPaymentStatus.PAID,
        paidAt: NOW,
      },
    });
    expect(result.paidAmount).toBe('15.00');
    expect(result.balance).toBe('0.00');
  });

  it('acepta un pago exacto con abonos previos', async () => {
    const mocks = createPrismaMock();
    setupPayment(mocks, {
      payments: [buildPayment({ amount: new Prisma.Decimal('5.00') })],
    });
    const service = createService(mocks.prisma);

    const result = await service.registerPayment(GYM_ID, RESERVATION_ID, {
      amount: 10,
      method: PaymentMethod.CARD,
    });

    expect(result.paidAmount).toBe('15.00');
    expect(result.balance).toBe('0.00');
    expect(mocks.tx.reservation.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: ReservationStatus.CONFIRMED,
          paymentStatus: ReservationPaymentStatus.PAID,
        }),
      }),
    );
  });

  it('no contabiliza pagos reembolsados al calcular el saldo', async () => {
    const mocks = createPrismaMock();
    setupPayment(mocks, {
      payments: [
        buildPayment({ amount: new Prisma.Decimal('5.00') }),
        buildPayment({
          id: 'payment-refunded',
          amount: new Prisma.Decimal('5.00'),
          status: PaymentStatus.REFUNDED,
        }),
      ],
    });
    const service = createService(mocks.prisma);

    const result = await service.registerPayment(GYM_ID, RESERVATION_ID, {
      amount: 10,
      method: PaymentMethod.PLIN,
    });

    expect(result.paidAmount).toBe('15.00');
    expect(result.balance).toBe('0.00');
  });

  it('busca la reserva bloqueada dentro del gimnasio autenticado', async () => {
    const mocks = createPrismaMock();
    setupPayment(mocks);
    const service = createService(mocks.prisma);

    await service.registerPayment(OTHER_GYM_ID, RESERVATION_ID, paymentDto);

    expect(mocks.tx.reservation.findFirst).toHaveBeenCalledWith({
      where: { id: RESERVATION_ID, gymId: OTHER_GYM_ID },
      include: { payments: true },
    });
  });
});

describe('ReservationsService.findPayments', () => {
  it('responde 404 si la reserva no existe en el gimnasio', async () => {
    const mocks = createPrismaMock();
    mocks.prisma.reservation.findFirst.mockResolvedValue(null);
    const service = createService(mocks.prisma);

    await expect(
      service.findPayments(GYM_ID, RESERVATION_ID),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(mocks.prisma.eventPayment.findMany).not.toHaveBeenCalled();
  });

  it('devuelve el historial de pagos de evento ordenado por fecha', async () => {
    const mocks = createPrismaMock();
    mocks.prisma.reservation.findFirst.mockResolvedValue({
      id: RESERVATION_ID,
    });
    mocks.prisma.eventPayment.findMany.mockResolvedValue([buildPayment()]);
    const service = createService(mocks.prisma);

    const result = await service.findPayments(GYM_ID, RESERVATION_ID);

    expect(mocks.prisma.reservation.findFirst).toHaveBeenCalledWith({
      where: { id: RESERVATION_ID, gymId: GYM_ID },
      select: { id: true },
    });
    expect(mocks.prisma.eventPayment.findMany).toHaveBeenCalledWith({
      where: { gymId: GYM_ID, reservationId: RESERVATION_ID },
      orderBy: { paymentDate: 'desc' },
    });
    expect(result).toHaveLength(1);
  });
});
