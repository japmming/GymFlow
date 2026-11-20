import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

import { PaymentMethod } from '../../generated/prisma/client';

export class CreateEventPaymentDto {
  @ApiProperty({
    description: 'Importe del pago. Se permiten pagos parciales.',
    minimum: 0.01,
    example: 25,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount!: number;

  @ApiProperty({
    description: 'Método utilizado para realizar el pago.',
    enum: PaymentMethod,
    example: PaymentMethod.YAPE,
  })
  @IsEnum(PaymentMethod)
  method!: PaymentMethod;

  @ApiPropertyOptional({
    description: 'Número de operación o referencia del pago.',
    maxLength: 100,
    example: 'YAPE-20261119-001',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  reference?: string;

  @ApiPropertyOptional({
    description: 'Observaciones adicionales del pago.',
    maxLength: 500,
    example: 'Primer abono de la inscripción.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
