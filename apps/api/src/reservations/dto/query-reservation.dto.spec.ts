import { BadRequestException, ValidationPipe } from '@nestjs/common';

import {
  ReservationPaymentStatus,
  ReservationStatus,
} from '../../generated/prisma/client';
import { QueryReservationDto } from './query-reservation.dto';

const validationPipe = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
});

const EVENT_ID = '1b6f4e1a-6a4b-4f1e-9f0b-2a6c3d8e9f10';
const MEMBER_ID = '2c7f4e1a-6a4b-4f1e-9f0b-2a6c3d8e9f11';

function validateQuery(query: Record<string, unknown>) {
  return validationPipe.transform(query, {
    type: 'query',
    metatype: QueryReservationDto,
  });
}

describe('QueryReservationDto', () => {
  it('acepta una consulta sin filtros', async () => {
    await expect(validateQuery({})).resolves.toBeInstanceOf(
      QueryReservationDto,
    );
  });

  it('acepta todos los filtros válidos', async () => {
    const result = await validateQuery({
      eventId: EVENT_ID,
      memberId: MEMBER_ID,
      status: ReservationStatus.PENDING_PAYMENT,
      paymentStatus: ReservationPaymentStatus.PARTIALLY_PAID,
    });

    expect(result).toBeInstanceOf(QueryReservationDto);
    expect(result).toMatchObject({
      eventId: EVENT_ID,
      memberId: MEMBER_ID,
      status: ReservationStatus.PENDING_PAYMENT,
      paymentStatus: ReservationPaymentStatus.PARTIALLY_PAID,
    });
  });

  it.each(['eventId', 'memberId'])(
    'responde 400 cuando %s no es un UUID',
    async (field) => {
      await expect(
        validateQuery({ [field]: 'no-es-un-uuid' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    },
  );

  it('responde 400 cuando el estado de reserva no es válido', async () => {
    await expect(
      validateQuery({ status: 'WAITLISTED' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('responde 400 cuando el estado de pago no es válido', async () => {
    await expect(
      validateQuery({ paymentStatus: 'REFUNDED' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('responde 400 cuando se envían propiedades desconocidas', async () => {
    await expect(validateQuery({ search: 'natalia' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
