import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateMyReservationDto {
  @ApiProperty({
    description: 'Identificador del evento al que desea inscribirse.',
    format: 'uuid',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(36)
  eventId!: string;
}
