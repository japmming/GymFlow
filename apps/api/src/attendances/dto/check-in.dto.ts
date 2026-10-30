import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CheckInDto {
  @IsOptional()
  @IsUUID()
  @ApiProperty({ required: false })
  qrToken?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  @ApiProperty({ required: false })
  memberCode?: string;
}
