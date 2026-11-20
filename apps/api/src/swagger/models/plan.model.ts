import { ApiProperty } from '@nestjs/swagger';

export class PlanResponseDto {
  @ApiProperty({
    format: 'uuid',
    example: '8f074fcb-e733-4e06-a898-52f2cfabd3af',
  })
  id!: string;

  @ApiProperty({
    format: 'uuid',
    example: '00000000-0000-0000-0000-000000000001',
  })
  gymId!: string;

  @ApiProperty({ example: 'Plan Mensual' })
  name!: string;

  @ApiProperty({
    description: 'Descripción comercial del plan.',
    nullable: true,
    example: 'Acceso completo por 30 días',
  })
  description!: string | null;

  @ApiProperty({
    description: 'Duración del plan en días.',
    example: 30,
  })
  durationDays!: number;

  @ApiProperty({
    description: 'Precio del plan como string decimal.',
    type: String,
    example: '49.90',
  })
  price!: string;

  @ApiProperty({
    description: 'Indica si el plan está disponible para nuevas membresías.',
    example: true,
  })
  active!: boolean;

  @ApiProperty({ format: 'date-time', example: '2026-10-17T14:41:52.740Z' })
  createdAt!: string;

  @ApiProperty({ format: 'date-time', example: '2026-10-17T14:41:52.740Z' })
  updatedAt!: string;
}
