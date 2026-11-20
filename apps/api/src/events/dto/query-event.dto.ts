import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';

import { EventStatus, EventType } from '../../generated/prisma/client';

export class QueryEventDto {
  @ApiPropertyOptional({
    description: 'Filtra por tipo de evento.',
    enum: EventType,
    example: EventType.CLASS,
  })
  @IsOptional()
  @IsEnum(EventType)
  type?: EventType;

  @ApiPropertyOptional({
    description: 'Filtra por estado del evento.',
    enum: EventStatus,
    example: EventStatus.PUBLISHED,
  })
  @IsOptional()
  @IsEnum(EventStatus)
  status?: EventStatus;

  @ApiPropertyOptional({
    description: 'Busca por nombre o descripción del evento.',
    example: 'yoga',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Fecha mínima de inicio en formato ISO 8601.',
    format: 'date-time',
    example: '2026-11-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({
    description: 'Fecha máxima de inicio en formato ISO 8601.',
    format: 'date-time',
    example: '2026-12-31T23:59:59.000Z',
  })
  @IsOptional()
  @IsDateString()
  to?: string;
}
