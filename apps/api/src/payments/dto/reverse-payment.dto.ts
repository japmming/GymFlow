import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class ReversePaymentDto {
  @ApiProperty({
    description: 'Motivo del reverso. Queda registrado para auditoría.',
    maxLength: 255,
    example: 'El pago fue registrado con un monto incorrecto.',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  reason!: string;
}
