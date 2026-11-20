import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class CreateReservationDto {
  @ApiProperty({
    description: 'Identificador del evento.',
    format: 'uuid',
    example: '1b6f4e1a-6a4b-4f1e-9f0b-2a6c3d8e9f10',
  })
  @IsUUID()
  eventId!: string;

  @ApiProperty({
    description: 'Identificador del socio que realizará la reserva.',
    format: 'uuid',
    example: '2c7f4e1a-6a4b-4f1e-9f0b-2a6c3d8e9f11',
  })
  @IsUUID()
  memberId!: string;
}
