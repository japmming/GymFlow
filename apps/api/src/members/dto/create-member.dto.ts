import {
  IsEmail,
  IsOptional,
  IsString,
  Length,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMemberDto {
  @IsString()
  @Length(2, 100)
  @ApiProperty()
  firstName!: string;

  @IsString()
  @Length(2, 100)
  @ApiProperty()
  lastName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  @ApiProperty()
  documentNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  @ApiProperty({ required: false })
  memberCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  @ApiProperty()
  phone?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(150)
  @ApiProperty()
  email?: string;
}
