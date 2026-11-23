import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, Matches } from 'class-validator';

const DATE_KEY_MESSAGE = 'La fecha debe tener el formato YYYY-MM-DD.';

export class QueryReportDto {
  @ApiPropertyOptional({
    description:
      'Primer día del reporte en formato YYYY-MM-DD. Por defecto, hace 6 días.',
    example: '2026-11-16',
  })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: DATE_KEY_MESSAGE,
  })
  from?: string;

  @ApiPropertyOptional({
    description:
      'Último día del reporte en formato YYYY-MM-DD. Por defecto, hoy.',
    example: '2026-11-22',
  })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: DATE_KEY_MESSAGE,
  })
  to?: string;
}
