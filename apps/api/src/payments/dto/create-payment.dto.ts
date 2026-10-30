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
import { ApiProperty } from '@nestjs/swagger';

export enum PaymentMethodDto {
  CASH = 'CASH',
  CARD = 'CARD',
  TRANSFER = 'TRANSFER',
  YAPE = 'YAPE',
  PLIN = 'PLIN',
  OTHER = 'OTHER',
}

export class CreatePaymentDto {
  @IsUUID()
  @ApiProperty()
  membershipId!: string;

  @IsNumber()
  @Min(0.01)
  @ApiProperty()
  amount!: number;

  @IsOptional()
  @IsDateString()
  @ApiProperty()
  paymentDate?: string;

  @IsEnum(PaymentMethodDto)
  @ApiProperty()
  method!: PaymentMethodDto;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @ApiProperty()
  reference?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @ApiProperty()
  notes?: string;
}
