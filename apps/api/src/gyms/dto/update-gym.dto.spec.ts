import { BadRequestException, ValidationPipe } from '@nestjs/common';

import { OPENING_DAYS, UpdateGymDto } from './update-gym.dto';

const validationPipe = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
});

function validOpeningHours() {
  return OPENING_DAYS.reduce<Record<string, unknown>>((hours, day) => {
    hours[day] = {
      closed: day === 'sunday',
      interval: {
        start: '09:00',
        end: day === 'saturday' ? '13:00' : '18:00',
      },
    };

    return hours;
  }, {});
}

async function validateBody(payload: Record<string, unknown>) {
  return (await validationPipe.transform(payload, {
    type: 'body',
    metatype: UpdateGymDto,
  })) as UpdateGymDto;
}

describe('UpdateGymDto', () => {
  it('acepta una configuración completa y normaliza slug y moneda', async () => {
    const result = await validateBody({
      name: '  GymFlow Demo  ',
      slug: '  GymFlow-Demo  ',
      timezone: 'America/Lima',
      currency: ' pen ',
      logoUrl: '',
      openingHours: validOpeningHours(),
    });

    expect(result.slug).toBe('gymflow-demo');
    expect(result.currency).toBe('PEN');
    expect(result.logoUrl).toBeNull();
    expect(result.openingHours?.monday.interval.start).toBe('09:00');
  });

  it('acepta una actualización parcial y permite quitar el logo con null', async () => {
    const result = await validateBody({ logoUrl: null });

    expect(result.logoUrl).toBeNull();
    expect(result.name).toBeUndefined();
    expect(result.openingHours).toBeUndefined();
  });

  it('rechaza una zona horaria inválida', async () => {
    await expect(
      validateBody({ timezone: 'America/NoExiste' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rechaza una moneda que no sea un código de 3 letras', async () => {
    await expect(validateBody({ currency: 'PEN1' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rechaza horarios con formato inválido', async () => {
    const openingHours = validOpeningHours();
    openingHours.monday = {
      closed: false,
      interval: { start: '9:00', end: '18:00' },
    };

    await expect(validateBody({ openingHours })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rechaza horarios donde el cierre precede a la apertura', async () => {
    const openingHours = validOpeningHours();
    openingHours.monday = {
      closed: false,
      interval: { start: '18:00', end: '09:00' },
    };

    await expect(validateBody({ openingHours })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rechaza horarios incompletos', async () => {
    const openingHours = validOpeningHours();
    delete openingHours.sunday;

    await expect(validateBody({ openingHours })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rechaza propiedades desconocidas', async () => {
    await expect(
      validateBody({ name: 'GymFlow', plan: 'PRO' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
