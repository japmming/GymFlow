import { BadRequestException, ValidationPipe } from '@nestjs/common';

import { PaymentMethod } from '../../generated/prisma/client';
import { CreateEventPaymentDto } from './create-event-payment.dto';

const validationPipe = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
});

const validPayload = {
  amount: 25,
  method: PaymentMethod.YAPE,
};

function validateBody(body: Record<string, unknown>) {
  return validationPipe.transform(body, {
    type: 'body',
    metatype: CreateEventPaymentDto,
  });
}

describe('CreateEventPaymentDto', () => {
  it('acepta un pago con los campos obligatorios', async () => {
    await expect(validateBody(validPayload)).resolves.toBeInstanceOf(
      CreateEventPaymentDto,
    );
  });

  it('acepta referencia y observaciones opcionales', async () => {
    const result = await validateBody({
      ...validPayload,
      reference: 'YAPE-20261119-001',
      notes: 'Primer abono de la inscripción.',
    });

    expect(result).toMatchObject({
      amount: 25,
      method: PaymentMethod.YAPE,
      reference: 'YAPE-20261119-001',
      notes: 'Primer abono de la inscripción.',
    });
  });

  it.each([
    ['amount', 0],
    ['amount', -1],
    ['amount', 10.123],
    ['amount', '25'],
  ])('responde 400 cuando %s es inválido (%s)', async (field, value) => {
    await expect(
      validateBody({ ...validPayload, [field]: value }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('responde 400 cuando falta el importe', async () => {
    const payload: Record<string, unknown> = { ...validPayload };
    delete payload.amount;

    await expect(validateBody(payload)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('responde 400 cuando el método de pago no es válido', async () => {
    await expect(
      validateBody({ ...validPayload, method: 'CRYPTO' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('responde 400 cuando falta el método de pago', async () => {
    const payload: Record<string, unknown> = { ...validPayload };
    delete payload.method;

    await expect(validateBody(payload)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('responde 400 cuando la referencia supera 100 caracteres', async () => {
    await expect(
      validateBody({ ...validPayload, reference: 'a'.repeat(101) }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('responde 400 cuando las observaciones superan 500 caracteres', async () => {
    await expect(
      validateBody({ ...validPayload, notes: 'a'.repeat(501) }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('responde 400 cuando la referencia no es texto', async () => {
    await expect(
      validateBody({ ...validPayload, reference: 12345 }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('responde 400 cuando se envían propiedades desconocidas', async () => {
    await expect(
      validateBody({ ...validPayload, status: 'COMPLETED' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
