import { BadRequestException, ValidationPipe } from '@nestjs/common';

import { EventType } from '../../generated/prisma/client';
import { CreateEventDto } from './create-event.dto';

const validationPipe = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
});

const validPayload = {
  name: 'Clase grupal de funcional',
  description: 'Entrenamiento funcional para socios del gimnasio.',
  type: EventType.CLASS,
  startDate: '2026-12-01T10:00:00.000Z',
  endDate: '2026-12-01T11:00:00.000Z',
  capacity: 20,
  price: 0,
  requiresActiveMembership: true,
};

const workshopPayload = {
  name: 'Taller de defensa personal',
  description: 'Taller práctico de defensa personal.',
  type: EventType.WORKSHOP,
  startDate: '2026-12-05T14:00:00.000Z',
  endDate: '2026-12-05T17:00:00.000Z',
  capacity: 15,
  price: 50,
  requiresActiveMembership: false,
};

const championshipPayload = {
  name: 'Campeonato interno GymFlow',
  description: 'Competencia deportiva entre miembros.',
  type: EventType.COMPETITION,
  startDate: '2026-12-12T09:00:00.000Z',
  endDate: '2026-12-12T16:00:00.000Z',
  capacity: 30,
  price: 25,
  requiresActiveMembership: true,
};

function validateBody(body: Record<string, unknown>) {
  return validationPipe.transform(body, {
    type: 'body',
    metatype: CreateEventDto,
  });
}

describe('CreateEventDto', () => {
  it.each([validPayload, workshopPayload, championshipPayload])(
    'acepta el evento válido "$name"',
    async (payload) => {
      await expect(validateBody(payload)).resolves.toBeInstanceOf(
        CreateEventDto,
      );
    },
  );

  it('responde 400 cuando la capacidad es igual a cero', async () => {
    await expect(
      validateBody({ ...validPayload, capacity: 0 }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('responde 400 cuando la capacidad es negativa', async () => {
    await expect(
      validateBody({ ...validPayload, capacity: -1 }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('responde 400 cuando el precio es negativo', async () => {
    await expect(
      validateBody({ ...validPayload, price: -0.01 }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('responde 400 cuando el tipo de evento no es válido', async () => {
    await expect(
      validateBody({ ...validPayload, type: 'CONFERENCE' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('responde 400 cuando falta la fecha de inicio', async () => {
    const withoutStartDate: Record<string, unknown> = { ...validPayload };
    delete withoutStartDate.startDate;

    await expect(validateBody(withoutStartDate)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('responde 400 cuando el nombre del entrenador supera 100 caracteres', async () => {
    await expect(
      validateBody({ ...validPayload, instructorName: 'x'.repeat(101) }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('responde 400 cuando se envían propiedades desconocidas', async () => {
    await expect(
      validateBody({ ...validPayload, status: 'PUBLISHED' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
