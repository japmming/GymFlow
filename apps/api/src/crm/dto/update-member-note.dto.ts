import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateMemberNoteDto {
  @ApiProperty({
    description: 'Nuevo contenido de la nota CRM del socio.',
    minLength: 1,
    maxLength: 1000,
    example: 'Confirmó el nuevo horario por teléfono.',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  body!: string;
}
