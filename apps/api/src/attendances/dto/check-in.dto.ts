import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CheckInDto {
  @ApiPropertyOptional({
    description:
      'Token QR del socio. Envía este campo o memberCode, pero no ambos.',
    format: 'uuid',
    example: '7c59e2e9-747f-4893-b6af-4c66ff2bae7f',
  })
  @IsOptional()
  @IsUUID()
  qrToken?: string;

  @ApiPropertyOptional({
    description:
      'Código interno del socio. Envía este campo o qrToken, pero no ambos.',
    maxLength: 30,
    example: 'DEMO-001',
  })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  memberCode?: string;
}
