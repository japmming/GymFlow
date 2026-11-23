import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

import { EventType } from '../../generated/prisma/client';

export class CreateEventDto {
  @ApiProperty({
    description: 'Nombre del evento.',
    maxLength: 150,
    example: 'Clase de yoga',
  })
  @IsString()
  @MaxLength(150)
  name!: string;

  @ApiPropertyOptional({
    description: 'Descripción del evento.',
    maxLength: 1000,
    example: 'Sesión de yoga para todos los niveles.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({
    description: 'Nombre del entrenador asignado al evento.',
    maxLength: 100,
    example: 'Carlos Ramírez',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  instructorName?: string | null;

  @ApiProperty({
    description: 'Tipo de evento.',
    enum: EventType,
    example: EventType.CLASS,
  })
  @IsEnum(EventType)
  type!: EventType;

  @ApiProperty({
    description: 'Fecha y hora de inicio en formato ISO 8601.',
    format: 'date-time',
    example: '2026-12-01T14:00:00.000Z',
  })
  @IsDateString()
  startDate!: string;

  @ApiProperty({
    description:
      'Fecha y hora de finalización en formato ISO 8601. Debe ser posterior al inicio.',
    format: 'date-time',
    example: '2026-12-01T15:30:00.000Z',
  })
  @IsDateString()
  endDate!: string;

  @ApiProperty({
    description: 'Cantidad de cupos disponibles.',
    minimum: 1,
    maximum: 10000,
    example: 20,
  })
  @IsInt()
  @Min(1)
  @Max(10000)
  capacity!: number;

  @ApiProperty({
    description: 'Precio de inscripción. Usa 0 para eventos gratuitos.',
    minimum: 0,
    example: 25,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price!: number;

  @ApiPropertyOptional({
    description: 'Exige una membresía activa para inscribirse.',
    default: false,
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  requiresActiveMembership?: boolean;
}
