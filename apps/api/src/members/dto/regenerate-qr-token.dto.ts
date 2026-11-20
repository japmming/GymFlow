import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class RegenerateQrTokenDto {
  @ApiPropertyOptional({
    description:
      'Motivo por el que se regenera el token QR. Se guarda para auditoría.',
    maxLength: 255,
    example: 'El socio perdió su credencial impresa.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  reason?: string;
}
