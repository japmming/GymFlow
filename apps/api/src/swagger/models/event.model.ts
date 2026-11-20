import { ApiProperty } from '@nestjs/swagger';

import { EventStatus, EventType } from '../../generated/prisma/client';

export class EventResponseDto {
  @ApiProperty({
    format: 'uuid',
    example: '1b6f4e1a-6a4b-4f1e-9f0b-2a6c3d8e9f10',
  })
  id!: string;

  @ApiProperty({
    format: 'uuid',
    example: '00000000-0000-0000-0000-000000000001',
  })
  gymId!: string;

  @ApiProperty({ example: 'Clase de yoga' })
  name!: string;

  @ApiProperty({
    description: 'Descripción del evento.',
    nullable: true,
    example: 'Sesión de yoga para todos los niveles.',
  })
  description!: string | null;

  @ApiProperty({
    description: 'Tipo de evento.',
    enum: EventType,
    example: EventType.CLASS,
  })
  type!: EventType;

  @ApiProperty({
    description: 'Estado actual del evento.',
    enum: EventStatus,
    example: EventStatus.DRAFT,
  })
  status!: EventStatus;

  @ApiProperty({
    description: 'Inicio del evento.',
    format: 'date-time',
    example: '2026-12-01T14:00:00.000Z',
  })
  startDate!: string;

  @ApiProperty({
    description: 'Fin del evento.',
    format: 'date-time',
    example: '2026-12-01T15:30:00.000Z',
  })
  endDate!: string;

  @ApiProperty({
    description: 'Cupos disponibles.',
    example: 20,
  })
  capacity!: number;

  @ApiProperty({
    description: 'Precio de inscripción como string decimal.',
    type: String,
    example: '25.00',
  })
  price!: string;

  @ApiProperty({
    description: 'Exige una membresía activa para inscribirse.',
    example: false,
  })
  requiresActiveMembership!: boolean;

  @ApiProperty({ format: 'date-time', example: '2026-11-17T10:30:00.000Z' })
  createdAt!: string;

  @ApiProperty({ format: 'date-time', example: '2026-11-17T10:30:00.000Z' })
  updatedAt!: string;
}
