import { ApiProperty } from '@nestjs/swagger';

export class MemberNoteAuthorDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Ana' })
  firstName!: string;

  @ApiProperty({ example: 'Torres' })
  lastName!: string;
}

export class MemberNoteDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  gymId!: string;

  @ApiProperty({ format: 'uuid' })
  memberId!: string;

  @ApiProperty({ format: 'uuid' })
  authorId!: string;

  @ApiProperty({ example: 'Solicitó cambiar su horario.' })
  body!: string;

  @ApiProperty({ type: MemberNoteAuthorDto })
  author!: MemberNoteAuthorDto;

  @ApiProperty({ format: 'date-time' })
  createdAt!: string;

  @ApiProperty({ format: 'date-time' })
  updatedAt!: string;
}

export class MemberActivityDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({
    enum: ['NOTE', 'ATTENDANCE', 'PAYMENT', 'MEMBERSHIP', 'RESERVATION'],
    example: 'NOTE',
  })
  type!: string;

  @ApiProperty({ format: 'date-time' })
  date!: string;

  @ApiProperty({ example: 'Nota del equipo' })
  title!: string;

  @ApiProperty({ nullable: true, example: 'Solicitó cambiar su horario.' })
  description!: string | null;
}
