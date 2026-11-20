import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsString,
  Length,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

import { UserRole } from '../../generated/prisma/client';

export class CreateUserDto {
  @ApiProperty({
    description: 'Correo electrónico único dentro del gimnasio.',
    format: 'email',
    maxLength: 150,
    example: 'recepcion2@gymflow.local',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  @MaxLength(150)
  email!: string;

  @ApiProperty({
    description: 'Nombres del usuario.',
    minLength: 2,
    maxLength: 100,
    example: 'Rosa',
  })
  @IsString()
  @Length(2, 100)
  firstName!: string;

  @ApiProperty({
    description: 'Apellidos del usuario.',
    minLength: 2,
    maxLength: 100,
    example: 'Paredes',
  })
  @IsString()
  @Length(2, 100)
  lastName!: string;

  @ApiProperty({
    description: 'Contraseña inicial del usuario.',
    minLength: 8,
    maxLength: 128,
    format: 'password',
    example: 'Recepcion123!',
  })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;

  @ApiProperty({
    description: 'Rol asignado al usuario.',
    enum: UserRole,
    example: UserRole.RECEPTION,
  })
  @IsEnum(UserRole)
  role!: UserRole;
}
