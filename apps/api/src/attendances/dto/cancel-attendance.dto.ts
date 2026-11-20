import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CancelAttendanceDto {
  @ApiProperty({
    description: 'Motivo de la anulación. Queda registrado para auditoría.',
    maxLength: 255,
    example: 'El socio registró su ingreso por error.',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  reason!: string;
}
