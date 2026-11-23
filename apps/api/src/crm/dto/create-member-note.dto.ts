import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateMemberNoteDto {
  @ApiProperty({
    description: 'Contenido de la nota CRM del socio.',
    minLength: 1,
    maxLength: 1000,
    example: 'Solicitó cambiar el horario de sus clases a partir del lunes.',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  body!: string;
}
