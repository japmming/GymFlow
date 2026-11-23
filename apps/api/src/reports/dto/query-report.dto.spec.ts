import { BadRequestException, ValidationPipe } from '@nestjs/common';

import { QueryReportDto } from './query-report.dto';

const validationPipe = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
});

async function validateBody(
  payload: Record<string, unknown>,
): Promise<QueryReportDto> {
  return (await validationPipe.transform(payload, {
    type: 'body',
    metatype: QueryReportDto,
  })) as QueryReportDto;
}

describe('QueryReportDto', () => {
  it('acepta un rango de fechas válido', async () => {
    const result = await validateBody({
      from: '2026-11-16',
      to: '2026-11-22',
    });

    expect(result.from).toBe('2026-11-16');
    expect(result.to).toBe('2026-11-22');
  });

  it('acepta un reporte sin fechas', async () => {
    const result = await validateBody({});

    expect(result.from).toBeUndefined();
    expect(result.to).toBeUndefined();
  });

  it('rechaza fechas con otro formato', async () => {
    await expect(validateBody({ from: '16/11/2026' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rechaza propiedades desconocidas', async () => {
    await expect(
      validateBody({ from: '2026-11-16', mode: 'week' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
