import { ApiProperty } from '@nestjs/swagger';

import { PaymentMethod, PaymentStatus } from '../../generated/prisma/client';

import { MemberResponseDto } from './member.model';
import { MembershipEntityDto } from './membership.model';

export class PaymentResponseDto {
  @ApiProperty({
    format: 'uuid',
    example: 'bca538e5-ce80-4fbc-ad15-54bfc85e2a71',
  })
  id!: string;

  @ApiProperty({
    format: 'uuid',
    example: '00000000-0000-0000-0000-000000000001',
  })
  gymId!: string;

  @ApiProperty({
    format: 'uuid',
    example: '9b436258-2ff8-43c6-94f5-272502f67a52',
  })
  memberId!: string;

  @ApiProperty({
    format: 'uuid',
    example: '9ddfc18d-84d5-4fa7-a9b2-9da778931c87',
  })
  membershipId!: string;

  @ApiProperty({
    description: 'Monto pagado como string decimal.',
    type: String,
    example: '49.90',
  })
  amount!: string;

  @ApiProperty({
    description: 'Fecha en que se registró el pago.',
    format: 'date-time',
    example: '2026-10-28T17:15:00.000Z',
  })
  paymentDate!: string;

  @ApiProperty({
    description: 'Medio de pago utilizado.',
    enum: PaymentMethod,
    example: PaymentMethod.TRANSFER,
  })
  method!: PaymentMethod;

  @ApiProperty({
    description: 'Estado del pago.',
    enum: PaymentStatus,
    example: PaymentStatus.COMPLETED,
  })
  status!: PaymentStatus;

  @ApiProperty({
    description:
      'Referencia externa del pago (nro. de operación, voucher, etc.).',
    nullable: true,
    example: 'DEMO-004-02',
  })
  reference!: string | null;

  @ApiProperty({
    description: 'Notas internas del pago.',
    nullable: true,
    example: 'Pago adelantado de renovación',
  })
  notes!: string | null;

  @ApiProperty({
    description: 'Fecha del reverso, si el pago fue reversado.',
    format: 'date-time',
    nullable: true,
    example: null,
  })
  reversedAt!: string | null;

  @ApiProperty({
    description: 'Motivo del reverso, si corresponde.',
    nullable: true,
    example: null,
  })
  reversalReason!: string | null;

  @ApiProperty({ format: 'date-time', example: '2026-10-28T17:15:00.000Z' })
  createdAt!: string;

  @ApiProperty({ format: 'date-time', example: '2026-10-28T17:15:00.000Z' })
  updatedAt!: string;

  @ApiProperty({
    description: 'Socio que realizó el pago.',
    type: MemberResponseDto,
  })
  member!: MemberResponseDto;

  @ApiProperty({
    description: 'Membresía a la que se aplicó el pago.',
    type: MembershipEntityDto,
  })
  membership!: MembershipEntityDto;
}
