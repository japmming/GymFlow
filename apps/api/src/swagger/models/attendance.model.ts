import { ApiProperty, OmitType } from '@nestjs/swagger';

import { MemberResponseDto } from './member.model';
import {
  MembershipEntityDto,
  MembershipWithSummaryDto,
} from './membership.model';

export class AttendanceResponseDto {
  @ApiProperty({
    format: 'uuid',
    example: '48ad1bf3-7194-46a1-9b7a-048e18e3569b',
  })
  id!: string;

  @ApiProperty({
    format: 'uuid',
    example: '00000000-0000-0000-0000-000000000001',
  })
  gymId!: string;

  @ApiProperty({
    format: 'uuid',
    example: 'a520963b-a659-4270-9456-86dd18914d70',
  })
  memberId!: string;

  @ApiProperty({
    description: 'Membresía usada para el ingreso.',
    format: 'uuid',
    nullable: true,
    example: '0e8d6404-7d73-42ea-8748-64429a6ba24d',
  })
  membershipId!: string | null;

  @ApiProperty({
    description: 'Día al que corresponde la asistencia.',
    format: 'date',
    example: '2026-10-29',
  })
  attendanceDate!: string;

  @ApiProperty({
    description: 'Momento exacto del check-in.',
    format: 'date-time',
    example: '2026-10-29T12:15:00.000Z',
  })
  checkedInAt!: string;

  @ApiProperty({
    description: 'Origen del registro: QR o MEMBER_CODE.',
    nullable: true,
    example: 'QR',
  })
  source!: string | null;

  @ApiProperty({
    description: 'Indica si la asistencia fue anulada.',
    example: false,
  })
  cancelled!: boolean;

  @ApiProperty({
    description: 'Clave interna que garantiza una asistencia activa por día.',
    nullable: true,
    example: 'ACTIVE',
  })
  activeKey!: string | null;

  @ApiProperty({
    description: 'Fecha de anulación, si corresponde.',
    format: 'date-time',
    nullable: true,
    example: null,
  })
  cancelledAt!: string | null;

  @ApiProperty({
    description: 'Motivo de la anulación, si corresponde.',
    nullable: true,
    example: null,
  })
  cancellationReason!: string | null;

  @ApiProperty({ format: 'date-time', example: '2026-10-30T01:43:47.625Z' })
  createdAt!: string;

  @ApiProperty({
    description: 'Socio que registró la asistencia.',
    type: MemberResponseDto,
  })
  member!: MemberResponseDto;

  @ApiProperty({
    description: 'Membresía asociada al ingreso.',
    type: MembershipEntityDto,
    nullable: true,
  })
  membership!: MembershipEntityDto | null;
}

export class CheckInResponseDto extends OmitType(AttendanceResponseDto, [
  'membership',
] as const) {
  @ApiProperty({
    description: 'Membresía usada en el check-in con el resumen de pagos.',
    type: MembershipWithSummaryDto,
    nullable: true,
  })
  membership!: MembershipWithSummaryDto | null;

  @ApiProperty({
    description:
      'Advertencia cuando la membresía tiene saldo pendiente. El ingreso se registra igual.',
    nullable: true,
    example: 'La membresía tiene un saldo pendiente de PEN 30.00.',
  })
  warning!: string | null;
}
