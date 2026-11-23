import { BadRequestException, NotFoundException } from '@nestjs/common';

import type { PrismaService } from '../prisma/prisma.service';
import { EventStatus, EventType } from '../generated/prisma/client';
import { EventsService } from './events.service';
import type { CreateEventDto } from './dto/create-event.dto';

interface PrismaMock {
  event: {
    findMany: jest.Mock;
    findFirst: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
  };
}

const GYM_ID = 'gym-1';
const OTHER_GYM_ID = 'gym-2';

const functionalClass: CreateEventDto = {
  name: 'Clase grupal de funcional',
  description: 'Entrenamiento funcional para socios del gimnasio.',
  type: EventType.CLASS,
  startDate: '2026-12-01T10:00:00.000Z',
  endDate: '2026-12-01T11:00:00.000Z',
  capacity: 20,
  price: 0,
  requiresActiveMembership: true,
};

const selfDefenseWorkshop: CreateEventDto = {
  name: 'Taller de defensa personal',
  description: 'Taller práctico de defensa personal.',
  type: EventType.WORKSHOP,
  startDate: '2026-12-05T14:00:00.000Z',
  endDate: '2026-12-05T17:00:00.000Z',
  capacity: 15,
  price: 50,
  requiresActiveMembership: false,
};

const internalChampionship: CreateEventDto = {
  name: 'Campeonato interno GymFlow',
  description: 'Competencia deportiva entre miembros.',
  type: EventType.COMPETITION,
  startDate: '2026-12-12T09:00:00.000Z',
  endDate: '2026-12-12T16:00:00.000Z',
  capacity: 30,
  price: 25,
  requiresActiveMembership: true,
};

function createPrismaMock(): PrismaMock {
  return {
    event: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };
}

function createService(prisma: PrismaMock): EventsService {
  return new EventsService(prisma as unknown as PrismaService);
}

function buildEvent(overrides: Record<string, unknown> = {}) {
  return {
    id: 'event-1',
    gymId: GYM_ID,
    name: functionalClass.name,
    description: functionalClass.description,
    type: EventType.CLASS,
    startDate: new Date(functionalClass.startDate),
    endDate: new Date(functionalClass.endDate),
    capacity: 20,
    price: 0,
    requiresActiveMembership: true,
    status: EventStatus.DRAFT,
    ...overrides,
  };
}

describe('EventsService.create', () => {
  it.each([functionalClass, selfDefenseWorkshop, internalChampionship])(
    'crea el evento "$name" en estado DRAFT',
    async (payload) => {
      const prisma = createPrismaMock();
      prisma.event.create.mockResolvedValue(
        buildEvent({
          name: payload.name,
          type: payload.type,
          capacity: payload.capacity,
          price: payload.price,
          requiresActiveMembership: payload.requiresActiveMembership,
        }),
      );

      const service = createService(prisma);
      const result = await service.create(GYM_ID, payload);

      expect(prisma.event.create).toHaveBeenCalledWith({
        data: {
          gymId: GYM_ID,
          name: payload.name,
          description: payload.description,
          instructorName: null,
          type: payload.type,
          startDate: new Date(payload.startDate),
          endDate: new Date(payload.endDate),
          capacity: payload.capacity,
          price: payload.price,
          requiresActiveMembership: payload.requiresActiveMembership,
          status: EventStatus.DRAFT,
        },
      });

      expect(result.status).toBe(EventStatus.DRAFT);
    },
  );

  it('crea un evento válido siempre en estado DRAFT', async () => {
    const prisma = createPrismaMock();
    prisma.event.create.mockResolvedValue(buildEvent());

    const service = createService(prisma);
    const result = await service.create(GYM_ID, {
      ...functionalClass,
      requiresActiveMembership: undefined,
    });

    expect(prisma.event.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        requiresActiveMembership: false,
        status: EventStatus.DRAFT,
      }),
    });

    expect(result.status).toBe(EventStatus.DRAFT);
  });

  it('normaliza nombre y descripción antes de guardar', async () => {
    const prisma = createPrismaMock();
    prisma.event.create.mockResolvedValue(buildEvent());

    const service = createService(prisma);
    await service.create(GYM_ID, {
      ...functionalClass,
      name: '  Clase de prueba  ',
      description: '   ',
    });

    expect(prisma.event.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: 'Clase de prueba',
        description: null,
      }),
    });
  });

  it('normaliza el nombre del entrenador antes de guardar', async () => {
    const prisma = createPrismaMock();
    prisma.event.create.mockResolvedValue(buildEvent());

    const service = createService(prisma);
    await service.create(GYM_ID, {
      ...functionalClass,
      instructorName: '  Carlos Ramírez  ',
    });

    expect(prisma.event.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        instructorName: 'Carlos Ramírez',
      }),
    });
  });

  it('rechaza fechas de finalización anteriores al inicio', async () => {
    const prisma = createPrismaMock();
    const service = createService(prisma);

    await expect(
      service.create(GYM_ID, {
        ...functionalClass,
        startDate: '2026-12-01T11:00:00.000Z',
        endDate: '2026-12-01T10:00:00.000Z',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    await expect(
      service.create(GYM_ID, {
        ...functionalClass,
        startDate: '2026-12-01T11:00:00.000Z',
        endDate: '2026-12-01T10:00:00.000Z',
      }),
    ).rejects.toThrow('La fecha de finalización debe ser posterior al inicio.');

    expect(prisma.event.create).not.toHaveBeenCalled();
  });

  it('rechaza fechas con formato inválido', async () => {
    const prisma = createPrismaMock();
    const service = createService(prisma);

    await expect(
      service.create(GYM_ID, {
        ...functionalClass,
        startDate: 'no-es-una-fecha',
      }),
    ).rejects.toThrow('Las fechas del evento no son válidas.');

    expect(prisma.event.create).not.toHaveBeenCalled();
  });
});

describe('EventsService.findOne', () => {
  it('devuelve el evento del gimnasio autenticado', async () => {
    const prisma = createPrismaMock();
    const event = buildEvent();
    prisma.event.findFirst.mockResolvedValue(event);

    const service = createService(prisma);
    const result = await service.findOne(GYM_ID, event.id);

    expect(prisma.event.findFirst).toHaveBeenCalledWith({
      where: {
        id: event.id,
        gymId: GYM_ID,
      },
    });

    expect(result).toBe(event);
  });

  it('responde 404 al consultar un evento de otro gimnasio', async () => {
    const prisma = createPrismaMock();
    prisma.event.findFirst.mockResolvedValue(null);

    const service = createService(prisma);

    await expect(
      service.findOne(OTHER_GYM_ID, 'event-1'),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(prisma.event.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'event-1',
        gymId: OTHER_GYM_ID,
      },
    });
  });
});

describe('EventsService.publish', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-11-17T12:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('publica un evento en borrador', async () => {
    const prisma = createPrismaMock();
    const event = buildEvent();
    prisma.event.findFirst.mockResolvedValue(event);
    prisma.event.update.mockResolvedValue({
      ...event,
      status: EventStatus.PUBLISHED,
    });

    const service = createService(prisma);
    const result = await service.publish(GYM_ID, event.id);

    expect(prisma.event.update).toHaveBeenCalledWith({
      where: { id: event.id },
      data: { status: EventStatus.PUBLISHED },
    });

    expect(result.status).toBe(EventStatus.PUBLISHED);
  });

  it('no publica un evento cancelado', async () => {
    const prisma = createPrismaMock();
    prisma.event.findFirst.mockResolvedValue(
      buildEvent({ status: EventStatus.CANCELLED }),
    );

    const service = createService(prisma);

    await expect(service.publish(GYM_ID, 'event-1')).rejects.toBeInstanceOf(
      BadRequestException,
    );

    await expect(service.publish(GYM_ID, 'event-1')).rejects.toThrow(
      'Solamente se pueden publicar eventos en borrador.',
    );

    expect(prisma.event.update).not.toHaveBeenCalled();
  });

  it('no publica un evento ya publicado', async () => {
    const prisma = createPrismaMock();
    prisma.event.findFirst.mockResolvedValue(
      buildEvent({ status: EventStatus.PUBLISHED }),
    );

    const service = createService(prisma);

    await expect(service.publish(GYM_ID, 'event-1')).rejects.toBeInstanceOf(
      BadRequestException,
    );

    expect(prisma.event.update).not.toHaveBeenCalled();
  });

  it('no publica un evento que ya finalizó', async () => {
    const prisma = createPrismaMock();
    prisma.event.findFirst.mockResolvedValue(
      buildEvent({
        status: EventStatus.DRAFT,
        startDate: new Date('2026-11-01T10:00:00.000Z'),
        endDate: new Date('2026-11-01T11:00:00.000Z'),
      }),
    );

    const service = createService(prisma);

    await expect(service.publish(GYM_ID, 'event-1')).rejects.toBeInstanceOf(
      BadRequestException,
    );

    await expect(service.publish(GYM_ID, 'event-1')).rejects.toThrow(
      'No se puede publicar un evento que ya finalizó.',
    );

    expect(prisma.event.update).not.toHaveBeenCalled();
  });

  it('no publica eventos de otro gimnasio', async () => {
    const prisma = createPrismaMock();
    prisma.event.findFirst.mockResolvedValue(null);

    const service = createService(prisma);

    await expect(
      service.publish(OTHER_GYM_ID, 'event-1'),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(prisma.event.update).not.toHaveBeenCalled();
  });
});

describe('EventsService.cancel', () => {
  it('cancela un evento en borrador', async () => {
    const prisma = createPrismaMock();
    const event = buildEvent();
    prisma.event.findFirst.mockResolvedValue(event);
    prisma.event.update.mockResolvedValue({
      ...event,
      status: EventStatus.CANCELLED,
    });

    const service = createService(prisma);
    const result = await service.cancel(GYM_ID, event.id);

    expect(prisma.event.update).toHaveBeenCalledWith({
      where: { id: event.id },
      data: { status: EventStatus.CANCELLED },
    });

    expect(result.status).toBe(EventStatus.CANCELLED);
  });

  it('cancela un evento publicado', async () => {
    const prisma = createPrismaMock();
    const event = buildEvent({ status: EventStatus.PUBLISHED });
    prisma.event.findFirst.mockResolvedValue(event);
    prisma.event.update.mockResolvedValue({
      ...event,
      status: EventStatus.CANCELLED,
    });

    const service = createService(prisma);
    const result = await service.cancel(GYM_ID, event.id);

    expect(prisma.event.update).toHaveBeenCalledWith({
      where: { id: event.id },
      data: { status: EventStatus.CANCELLED },
    });

    expect(result.status).toBe(EventStatus.CANCELLED);
  });

  it('no cancela un evento completado', async () => {
    const prisma = createPrismaMock();
    prisma.event.findFirst.mockResolvedValue(
      buildEvent({ status: EventStatus.COMPLETED }),
    );

    const service = createService(prisma);

    await expect(service.cancel(GYM_ID, 'event-1')).rejects.toBeInstanceOf(
      BadRequestException,
    );

    await expect(service.cancel(GYM_ID, 'event-1')).rejects.toThrow(
      'El evento ya está cancelado o finalizado.',
    );

    expect(prisma.event.update).not.toHaveBeenCalled();
  });

  it('no cancela un evento ya cancelado', async () => {
    const prisma = createPrismaMock();
    prisma.event.findFirst.mockResolvedValue(
      buildEvent({ status: EventStatus.CANCELLED }),
    );

    const service = createService(prisma);

    await expect(service.cancel(GYM_ID, 'event-1')).rejects.toBeInstanceOf(
      BadRequestException,
    );

    expect(prisma.event.update).not.toHaveBeenCalled();
  });

  it('no cancela eventos de otro gimnasio', async () => {
    const prisma = createPrismaMock();
    prisma.event.findFirst.mockResolvedValue(null);

    const service = createService(prisma);

    await expect(
      service.cancel(OTHER_GYM_ID, 'event-1'),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(prisma.event.update).not.toHaveBeenCalled();
  });
});

describe('EventsService.update', () => {
  it('actualiza un evento en borrador', async () => {
    const prisma = createPrismaMock();
    const event = buildEvent();
    prisma.event.findFirst.mockResolvedValue(event);
    prisma.event.update.mockResolvedValue({
      ...event,
      capacity: 25,
    });

    const service = createService(prisma);
    await service.update(GYM_ID, event.id, {
      capacity: 25,
      name: '  Clase funcional avanzada  ',
    });

    expect(prisma.event.update).toHaveBeenCalledWith({
      where: { id: event.id },
      data: {
        name: 'Clase funcional avanzada',
        capacity: 25,
      },
    });
  });

  it('no modifica un evento cancelado', async () => {
    const prisma = createPrismaMock();
    prisma.event.findFirst.mockResolvedValue(
      buildEvent({ status: EventStatus.CANCELLED }),
    );

    const service = createService(prisma);

    await expect(
      service.update(GYM_ID, 'event-1', { capacity: 25 }),
    ).rejects.toBeInstanceOf(BadRequestException);

    await expect(
      service.update(GYM_ID, 'event-1', { capacity: 25 }),
    ).rejects.toThrow(
      'No se puede modificar un evento cancelado o finalizado.',
    );

    expect(prisma.event.update).not.toHaveBeenCalled();
  });

  it('no modifica un evento finalizado', async () => {
    const prisma = createPrismaMock();
    prisma.event.findFirst.mockResolvedValue(
      buildEvent({ status: EventStatus.COMPLETED }),
    );

    const service = createService(prisma);

    await expect(
      service.update(GYM_ID, 'event-1', { capacity: 25 }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.event.update).not.toHaveBeenCalled();
  });

  it('valida las fechas resultantes al actualizar', async () => {
    const prisma = createPrismaMock();
    prisma.event.findFirst.mockResolvedValue(buildEvent());

    const service = createService(prisma);

    await expect(
      service.update(GYM_ID, 'event-1', {
        endDate: '2026-12-01T09:00:00.000Z',
      }),
    ).rejects.toThrow('La fecha de finalización debe ser posterior al inicio.');

    expect(prisma.event.update).not.toHaveBeenCalled();
  });
});

describe('EventsService.findAll', () => {
  it('lista solo los eventos del gimnasio autenticado', async () => {
    const prisma = createPrismaMock();
    prisma.event.findMany.mockResolvedValue([]);

    const service = createService(prisma);
    await service.findAll(GYM_ID, {});

    expect(prisma.event.findMany).toHaveBeenCalledWith({
      where: { gymId: GYM_ID },
      orderBy: { startDate: 'desc' },
    });
  });

  it('filtra por tipo y estado', async () => {
    const prisma = createPrismaMock();
    prisma.event.findMany.mockResolvedValue([]);

    const service = createService(prisma);
    await service.findAll(GYM_ID, {
      type: EventType.WORKSHOP,
      status: EventStatus.PUBLISHED,
    });

    expect(prisma.event.findMany).toHaveBeenCalledWith({
      where: {
        gymId: GYM_ID,
        type: EventType.WORKSHOP,
        status: EventStatus.PUBLISHED,
      },
      orderBy: { startDate: 'desc' },
    });
  });

  it('busca por nombre o descripción sin distinguir mayúsculas', async () => {
    const prisma = createPrismaMock();
    prisma.event.findMany.mockResolvedValue([]);

    const service = createService(prisma);
    await service.findAll(GYM_ID, { search: '  defensa  ' });

    expect(prisma.event.findMany).toHaveBeenCalledWith({
      where: {
        gymId: GYM_ID,
        OR: [
          {
            name: {
              contains: 'defensa',
              mode: 'insensitive',
            },
          },
          {
            description: {
              contains: 'defensa',
              mode: 'insensitive',
            },
          },
        ],
      },
      orderBy: { startDate: 'desc' },
    });
  });

  it('filtra por rango de fechas de inicio', async () => {
    const prisma = createPrismaMock();
    prisma.event.findMany.mockResolvedValue([]);

    const service = createService(prisma);
    await service.findAll(GYM_ID, {
      from: '2026-12-01T00:00:00.000Z',
      to: '2026-12-31T23:59:59.000Z',
    });

    expect(prisma.event.findMany).toHaveBeenCalledWith({
      where: {
        gymId: GYM_ID,
        startDate: {
          gte: new Date('2026-12-01T00:00:00.000Z'),
          lte: new Date('2026-12-31T23:59:59.000Z'),
        },
      },
      orderBy: { startDate: 'desc' },
    });
  });

  it('combina todos los filtros disponibles', async () => {
    const prisma = createPrismaMock();
    prisma.event.findMany.mockResolvedValue([]);

    const service = createService(prisma);
    await service.findAll(GYM_ID, {
      type: EventType.COMPETITION,
      status: EventStatus.DRAFT,
      search: 'campeonato',
      from: '2026-12-01T00:00:00.000Z',
      to: '2026-12-31T23:59:59.000Z',
    });

    expect(prisma.event.findMany).toHaveBeenCalledWith({
      where: {
        gymId: GYM_ID,
        type: EventType.COMPETITION,
        status: EventStatus.DRAFT,
        OR: [
          {
            name: {
              contains: 'campeonato',
              mode: 'insensitive',
            },
          },
          {
            description: {
              contains: 'campeonato',
              mode: 'insensitive',
            },
          },
        ],
        startDate: {
          gte: new Date('2026-12-01T00:00:00.000Z'),
          lte: new Date('2026-12-31T23:59:59.000Z'),
        },
      },
      orderBy: { startDate: 'desc' },
    });
  });
});
