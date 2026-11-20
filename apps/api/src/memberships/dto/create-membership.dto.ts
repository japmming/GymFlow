import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, Matches } from 'class-validator';

export class CreateMembershipDto {
  @ApiProperty({
    description: 'Identificador del socio que recibirá la membresía.',
    format: 'uuid',
    example: 'a9d21cf1-8ccf-42a2-92b6-27ace628bb0f',
  })
  @IsUUID()
  memberId!: string;

  @ApiProperty({
    description: 'Identificador del plan contratado.',
    format: 'uuid',
    example: '8f074fcb-e733-4e06-a898-52f2cfabd3af',
  })
  @IsUUID()
  planId!: string;

  @ApiProperty({
    description:
      'Fecha de inicio deseada en formato YYYY-MM-DD. Si el socio ya tiene una membresía vigente, el sistema la encadena al día siguiente.',
    format: 'date',
    example: '2026-11-18',
  })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'La fecha de inicio debe tener el formato YYYY-MM-DD.',
  })
  startDate!: string;
}
