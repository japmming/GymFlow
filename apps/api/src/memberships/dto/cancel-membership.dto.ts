import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CancelMembershipDto {
  @ApiProperty({
    description: 'Motivo de la cancelación. Queda registrado para auditoría.',
    maxLength: 255,
    example: 'El socio solicitó cancelar por motivos personales.',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  reason!: string;
}
