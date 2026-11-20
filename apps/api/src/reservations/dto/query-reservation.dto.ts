import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';

import {
  ReservationPaymentStatus,
  ReservationStatus,
} from '../../generated/prisma/client';

export class QueryReservationDto {
  @ApiPropertyOptional({
    description: 'Filtrar por identificador del evento.',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  eventId?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por identificador del socio.',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  memberId?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por estado de la reserva.',
    enum: ReservationStatus,
  })
  @IsOptional()
  @IsEnum(ReservationStatus)
  status?: ReservationStatus;

  @ApiPropertyOptional({
    description: 'Filtrar por estado del pago.',
    enum: ReservationPaymentStatus,
  })
  @IsOptional()
  @IsEnum(ReservationPaymentStatus)
  paymentStatus?: ReservationPaymentStatus;
}
