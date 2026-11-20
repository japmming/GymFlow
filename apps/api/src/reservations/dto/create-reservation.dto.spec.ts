import { BadRequestException, ValidationPipe } from '@nestjs/common';

import { CreateReservationDto } from './create-reservation.dto';

const validationPipe = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
});

const EVENT_ID = '1b6f4e1a-6a4b-4f1e-9f0b-2a6c3d8e9f10';
const MEMBER_ID = '2c7f4e1a-6a4b-4f1e-9f0b-2a6c3d8e9f11';

const validPayload = {
  eventId: EVENT_ID,
  memberId: MEMBER_ID,
};

function validateBody(body: Record<string, unknown>) {
  return validationPipe.transform(body, {
    type: 'body',
    metatype: CreateReservationDto,
  });
}

describe('CreateReservationDto', () => {
  it('acepta identificadores UUID válidos', async () => {
    await expect(validateBody(validPayload)).resolves.toBeInstanceOf(
      CreateReservationDto,
    );
  });

  it.each(['eventId', 'memberId'])(
    'responde 400 cuando falta %s',
    async (field) => {
      const payload: Record<string, unknown> = { ...validPayload };
      delete payload[field];

      await expect(validateBody(payload)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    },
  );

  it.each([
    ['eventId', 'no-es-un-uuid'],
    ['memberId', '12345'],
  ])('responde 400 cuando %s no es un UUID', async (field, value) => {
    await expect(
      validateBody({ ...validPayload, [field]: value }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it.each(['eventId', 'memberId'])(
    'responde 400 cuando %s no es texto',
    async (field) => {
      await expect(
        validateBody({ ...validPayload, [field]: 123 }),
      ).rejects.toBeInstanceOf(BadRequestException);
    },
  );

  it('responde 400 cuando se envían propiedades desconocidas', async () => {
    await expect(
      validateBody({ ...validPayload, status: 'CONFIRMED' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
