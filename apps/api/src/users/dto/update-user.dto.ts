import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  MinLength,
} from 'class-validator';

import { UserRole } from '../../generated/prisma/client';

export class UpdateUserDto {
  @ApiPropertyOptional({
    description: 'Nombres del usuario.',
    minLength: 2,
    maxLength: 100,
    example: 'Rosa Elena',
  })
  @IsOptional()
  @IsString()
  @Length(2, 100)
  firstName?: string;

  @ApiPropertyOptional({
    description: 'Apellidos del usuario.',
    minLength: 2,
    maxLength: 100,
    example: 'Paredes Ríos',
  })
  @IsOptional()
  @IsString()
  @Length(2, 100)
  lastName?: string;

  @ApiPropertyOptional({
    description: 'Nuevo rol del usuario.',
    enum: UserRole,
    example: UserRole.ADMIN,
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({
    description:
      'Socio vinculado. Obligatorio si el rol resultante es MEMBER; se ignora para otros roles.',
    format: 'uuid',
    nullable: true,
    example: '87c3e94d-360d-4191-bd6a-3818d00091f9',
  })
  @IsOptional()
  @IsString()
  memberId?: string | null;

  @ApiPropertyOptional({
    description: 'Indica si el usuario puede iniciar sesión.',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @ApiPropertyOptional({
    description: 'Nueva contraseña. Solo se actualiza si se envía el campo.',
    minLength: 8,
    maxLength: 128,
    format: 'password',
    example: 'NuevaClave123!',
  })
  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password?: string;
}
