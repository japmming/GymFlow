import {
  IsEmail,
  IsEnum,
  IsString,
  Length,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

import { UserRole } from '../../generated/prisma/client';

export class CreateUserDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  @MaxLength(150)
  @ApiProperty()
  email!: string;

  @IsString()
  @Length(2, 100)
  @ApiProperty()
  firstName!: string;

  @IsString()
  @Length(2, 100)
  @ApiProperty()
  lastName!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @ApiProperty()
  password!: string;

  @IsEnum(UserRole)
  @ApiProperty({ enum: UserRole })
  role!: UserRole;
}
