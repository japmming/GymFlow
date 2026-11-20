import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class QueryAttendanceDto {
  @ApiPropertyOptional({
    description: 'Fecha inicial del rango en formato YYYY-MM-DD.',
    format: 'date',
    example: '2026-11-01',
  })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'La fecha "desde" debe tener el formato YYYY-MM-DD.',
  })
  from?: string;

  @ApiPropertyOptional({
    description: 'Fecha final del rango en formato YYYY-MM-DD.',
    format: 'date',
    example: '2026-11-17',
  })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'La fecha "hasta" debe tener el formato YYYY-MM-DD.',
  })
  to?: string;

  @ApiPropertyOptional({
    description:
      'Texto libre para buscar por nombre, apellido, documento, teléfono o código de socio.',
    example: 'Camila',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Número de página (base 1).',
    minimum: 1,
    default: 1,
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({
    description: 'Cantidad de registros por página (máximo 100).',
    minimum: 1,
    maximum: 100,
    default: 20,
    example: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;
}
