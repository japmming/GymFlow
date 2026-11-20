import {
  IsEmail,
  IsOptional,
  IsString,
  Length,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMemberDto {
  @ApiProperty({
    description: 'Nombres del socio.',
    minLength: 2,
    maxLength: 100,
    example: 'Luis Miguel',
  })
  @IsString()
  @Length(2, 100)
  firstName!: string;

  @ApiProperty({
    description: 'Apellidos del socio.',
    minLength: 2,
    maxLength: 100,
    example: 'Manrique Quispe',
  })
  @IsString()
  @Length(2, 100)
  lastName!: string;

  @ApiPropertyOptional({
    description: 'Documento de identidad. Debe ser único dentro del gimnasio.',
    maxLength: 30,
    example: '72678130',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  documentNumber?: string | null;

  @ApiPropertyOptional({
    description:
      'Código interno del socio. Si se omite, el sistema genera uno automáticamente.',
    maxLength: 30,
    example: 'C0006',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  memberCode?: string | null;

  @ApiPropertyOptional({
    description: 'Teléfono de contacto.',
    maxLength: 30,
    example: '978210021',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string | null;

  @ApiPropertyOptional({
    description: 'Correo electrónico de contacto.',
    format: 'email',
    maxLength: 150,
    example: 'luismi.manriq@correo.com',
    nullable: true,
  })
  @IsOptional()
  @IsEmail()
  @MaxLength(150)
  email?: string | null;
}
