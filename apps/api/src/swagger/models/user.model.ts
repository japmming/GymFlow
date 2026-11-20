import { ApiProperty } from '@nestjs/swagger';

import { UserRole } from '../../generated/prisma/client';

export class UserResponseDto {
  @ApiProperty({
    format: 'uuid',
    example: '6f0f4e1a-6a4b-4f1e-9f0b-2a6c3d8e9f10',
  })
  id!: string;

  @ApiProperty({
    format: 'uuid',
    example: '00000000-0000-0000-0000-000000000001',
  })
  gymId!: string;

  @ApiProperty({ format: 'email', example: 'recepcion@gymflow.local' })
  email!: string;

  @ApiProperty({ example: 'Rosa' })
  firstName!: string;

  @ApiProperty({ example: 'Paredes' })
  lastName!: string;

  @ApiProperty({
    description: 'Rol del usuario dentro del gimnasio.',
    enum: UserRole,
    example: UserRole.RECEPTION,
  })
  role!: UserRole;

  @ApiProperty({
    description: 'Indica si el usuario puede iniciar sesión.',
    example: true,
  })
  active!: boolean;

  @ApiProperty({
    description: 'Último inicio de sesión registrado.',
    format: 'date-time',
    nullable: true,
    example: '2026-11-17T10:30:00.000Z',
  })
  lastLoginAt!: string | null;

  @ApiProperty({ format: 'date-time', example: '2026-10-17T14:41:52.740Z' })
  createdAt!: string;

  @ApiProperty({ format: 'date-time', example: '2026-10-17T14:41:52.740Z' })
  updatedAt!: string;
}
