import { ApiProperty } from '@nestjs/swagger';

import { MemberStatus } from '../../generated/prisma/client';

export class MemberResponseDto {
  @ApiProperty({
    format: 'uuid',
    example: 'a9d21cf1-8ccf-42a2-92b6-27ace628bb0f',
  })
  id!: string;

  @ApiProperty({
    format: 'uuid',
    example: '00000000-0000-0000-0000-000000000001',
  })
  gymId!: string;

  @ApiProperty({ example: 'Luis Miguel' })
  firstName!: string;

  @ApiProperty({ example: 'Manrique Quispe' })
  lastName!: string;

  @ApiProperty({
    description: 'Documento de identidad del socio.',
    nullable: true,
    example: '72678130',
  })
  documentNumber!: string | null;

  @ApiProperty({
    description: 'Código interno único del socio.',
    example: 'CYBYSB',
  })
  memberCode!: string;

  @ApiProperty({
    description: 'Teléfono de contacto.',
    nullable: true,
    example: '978210021',
  })
  phone!: string | null;

  @ApiProperty({
    description: 'Correo electrónico de contacto.',
    format: 'email',
    nullable: true,
    example: 'luismi.manriq@correo.com',
  })
  email!: string | null;

  @ApiProperty({
    description:
      'Token único que identifica al socio en el lector de códigos QR.',
    format: 'uuid',
    example: '7c59e2e9-747f-4893-b6af-4c66ff2bae7f',
  })
  qrToken!: string;

  @ApiProperty({
    description: 'Última fecha en que se regeneró el token QR.',
    format: 'date-time',
    nullable: true,
    example: null,
  })
  qrTokenRegeneratedAt!: string | null;

  @ApiProperty({
    description: 'Motivo de la última regeneración del token QR.',
    nullable: true,
    example: null,
  })
  qrTokenRegenerationReason!: string | null;

  @ApiProperty({
    description: 'Estado del socio.',
    enum: MemberStatus,
    example: MemberStatus.ACTIVE,
  })
  status!: MemberStatus;

  @ApiProperty({ format: 'date-time', example: '2026-11-14T03:52:57.802Z' })
  createdAt!: string;

  @ApiProperty({ format: 'date-time', example: '2026-11-14T03:52:57.802Z' })
  updatedAt!: string;
}
