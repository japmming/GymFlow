import { ApiProperty } from '@nestjs/swagger';

import { UserRole } from '../../generated/prisma/client';

export class AuthUserDto {
  @ApiProperty({
    description: 'Identificador del usuario.',
    format: 'uuid',
    example: '6f0f4e1a-6a4b-4f1e-9f0b-2a6c3d8e9f10',
  })
  id!: string;

  @ApiProperty({
    description: 'Gimnasio al que pertenece el usuario.',
    format: 'uuid',
    example: '00000000-0000-0000-0000-000000000001',
  })
  gymId!: string;

  @ApiProperty({
    description: 'Correo electrónico del usuario.',
    format: 'email',
    example: 'admin@gymflow.local',
  })
  email!: string;

  @ApiProperty({ example: 'Ana' })
  firstName!: string;

  @ApiProperty({ example: 'Torres' })
  lastName!: string;

  @ApiProperty({
    description: 'Rol del usuario dentro del gimnasio.',
    enum: UserRole,
    example: UserRole.ADMIN,
  })
  role!: UserRole;

  @ApiProperty({
    description: 'Último inicio de sesión registrado.',
    format: 'date-time',
    nullable: true,
    example: '2026-11-17T10:30:00.000Z',
  })
  lastLoginAt!: string | null;
}

export class AuthSessionResponseDto {
  @ApiProperty({
    description:
      'Access token JWT. Debe enviarse en el header Authorization como "Bearer <token>".',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI...',
  })
  accessToken!: string;

  @ApiProperty({
    description: 'Datos del usuario autenticado.',
    type: AuthUserDto,
  })
  user!: AuthUserDto;
}
