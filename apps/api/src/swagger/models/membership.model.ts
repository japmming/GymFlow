import { ApiProperty } from '@nestjs/swagger';

import { MembershipStatus } from '../../generated/prisma/client';

import { MemberResponseDto } from './member.model';
import { PlanResponseDto } from './plan.model';

export class MembershipEntityDto {
  @ApiProperty({
    format: 'uuid',
    example: '59fe39ec-28d3-4892-8005-4c61147cdb6b',
  })
  id!: string;

  @ApiProperty({
    format: 'uuid',
    example: '00000000-0000-0000-0000-000000000001',
  })
  gymId!: string;

  @ApiProperty({
    format: 'uuid',
    example: 'a9d21cf1-8ccf-42a2-92b6-27ace628bb0f',
  })
  memberId!: string;

  @ApiProperty({
    format: 'uuid',
    example: 'ff68ea06-7fa5-4ef6-abb4-f344a3030b6c',
  })
  planId!: string;

  @ApiProperty({
    description: 'Primer día de vigencia de la membresía.',
    format: 'date',
    example: '2026-11-16',
  })
  startDate!: string;

  @ApiProperty({
    description: 'Último día de vigencia de la membresía.',
    format: 'date',
    example: '2027-02-13',
  })
  endDate!: string;

  @ApiProperty({
    description: 'Precio acordado al momento de crear la membresía.',
    type: String,
    example: '139.90',
  })
  price!: string;

  @ApiProperty({
    enum: MembershipStatus,
    example: MembershipStatus.ACTIVE,
  })
  status!: MembershipStatus;

  @ApiProperty({
    description: 'Fecha de cancelación, si corresponde.',
    format: 'date-time',
    nullable: true,
    example: null,
  })
  cancelledAt!: string | null;

  @ApiProperty({
    description: 'Motivo de la cancelación, si corresponde.',
    nullable: true,
    example: null,
  })
  cancellationReason!: string | null;

  @ApiProperty({ format: 'date-time', example: '2026-11-14T03:54:15.044Z' })
  createdAt!: string;

  @ApiProperty({ format: 'date-time', example: '2026-11-14T03:54:15.044Z' })
  updatedAt!: string;

  @ApiProperty({
    description: 'Plan asociado a la membresía.',
    type: PlanResponseDto,
  })
  plan!: PlanResponseDto;
}

export class MembershipWithSummaryDto extends MembershipEntityDto {
  @ApiProperty({
    description: 'Monto total pagado con pagos completados.',
    example: 49.9,
  })
  paidAmount!: number;

  @ApiProperty({
    description: 'Saldo pendiente de la membresía.',
    example: 90,
  })
  balance!: number;
}

export class MembershipWithMemberDto extends MembershipEntityDto {
  @ApiProperty({
    description: 'Socio titular de la membresía.',
    type: MemberResponseDto,
  })
  member!: MemberResponseDto;
}

export class MembershipResponseDto extends MembershipWithSummaryDto {
  @ApiProperty({
    description: 'Socio titular de la membresía.',
    type: MemberResponseDto,
  })
  member!: MemberResponseDto;
}
