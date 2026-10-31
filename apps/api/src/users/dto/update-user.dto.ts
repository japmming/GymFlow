import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

import { UserRole } from '../../generated/prisma/client';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @Length(2, 100)
  @ApiProperty({ required: false })
  firstName?: string;

  @IsOptional()
  @IsString()
  @Length(2, 100)
  @ApiProperty({ required: false })
  lastName?: string;

  @IsOptional()
  @IsEnum(UserRole)
  @ApiProperty({ enum: UserRole, required: false })
  role?: UserRole;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({ required: false })
  active?: boolean;

  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @ApiProperty({ required: false })
  password?: string;
}
