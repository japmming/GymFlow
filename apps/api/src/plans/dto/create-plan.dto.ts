import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePlanDto {
  @IsString()
  @Length(2, 100)
  @ApiProperty()
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @ApiProperty()
  description?: string;

  @IsInt()
  @Min(1)
  @Max(3650)
  @ApiProperty()
  durationDays!: number;

  @IsNumber()
  @Min(0)
  @ApiProperty()
  price!: number;

  @IsOptional()
  @IsBoolean()
  @ApiProperty()
  active?: boolean;
}
