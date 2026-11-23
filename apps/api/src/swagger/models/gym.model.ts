import { ApiProperty } from '@nestjs/swagger';

import { OpeningDayDto, OpeningHoursDto } from '../../gyms/dto/update-gym.dto';

export class GymSettingsResponseDto {
  @ApiProperty({
    format: 'uuid',
    example: '00000000-0000-0000-0000-000000000001',
  })
  id!: string;

  @ApiProperty({ example: 'GymFlow Demo' })
  name!: string;

  @ApiProperty({ example: 'gymflow-demo' })
  slug!: string;

  @ApiProperty({ example: 'America/Lima' })
  timezone!: string;

  @ApiProperty({ example: 'PEN' })
  currency!: string;

  @ApiProperty({
    description: 'URL del logo del gimnasio.',
    format: 'uri',
    nullable: true,
    example: 'https://cdn.gymflow.local/logo.png',
  })
  logoUrl!: string | null;

  @ApiProperty({
    description:
      'Horarios por día de la semana. Null si aún no se han configurado.',
    type: OpeningHoursDto,
    nullable: true,
  })
  openingHours!: Record<string, OpeningDayDto> | null;

  @ApiProperty({ format: 'date-time', example: '2026-11-22T12:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ format: 'date-time', example: '2026-11-23T09:30:00.000Z' })
  updatedAt!: string;
}
