import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export enum PaymentMethodDto {
  CASH = 'CASH',
  CARD = 'CARD',
  TRANSFER = 'TRANSFER',
  YAPE = 'YAPE',
  PLIN = 'PLIN',
  OTHER = 'OTHER',
}

export class CreatePaymentDto {
  @ApiProperty({
    description: 'Membresía a la que se aplicará el pago.',
    format: 'uuid',
    example: '9ddfc18d-84d5-4fa7-a9b2-9da778931c87',
  })
  @IsUUID()
  membershipId!: string;

  @ApiProperty({
    description:
      'Monto del pago. No puede superar el saldo pendiente de la membresía.',
    minimum: 0.01,
    example: 49.9,
  })
  @IsNumber()
  @Min(0.01)
  amount!: number;

  @ApiPropertyOptional({
    description:
      'Fecha del pago en formato ISO 8601. Si se omite, se usa la fecha actual.',
    format: 'date-time',
    example: '2026-11-17T10:30:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  paymentDate?: string;

  @ApiProperty({
    description: 'Medio de pago utilizado.',
    enum: PaymentMethodDto,
    example: PaymentMethodDto.TRANSFER,
  })
  @IsEnum(PaymentMethodDto)
  method!: PaymentMethodDto;

  @ApiPropertyOptional({
    description: 'Número de operación, voucher o referencia externa.',
    maxLength: 100,
    example: 'OP-2026-000123',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  reference?: string;

  @ApiPropertyOptional({
    description: 'Notas internas sobre el pago.',
    maxLength: 255,
    example: 'Pago parcial de la membresía trimestral.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  notes?: string;
}
