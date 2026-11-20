import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class LoginDto {
  @ApiProperty({
    description: 'Correo electrónico registrado en el gimnasio.',
    format: 'email',
    maxLength: 150,
    example: 'admin@gymflow.local',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  @MaxLength(150)
  email!: string;

  @ApiProperty({
    description: 'Contraseña del usuario.',
    minLength: 8,
    maxLength: 128,
    format: 'password',
    example: 'Admin123!',
  })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;
}
