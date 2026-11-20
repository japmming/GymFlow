import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/authenticated-user';

import { ErrorResponseDto } from '../swagger/models/common.model';
import { BEARER_AUTH } from '../swagger/swagger.constants';

import { ReservationsService } from './reservations.service';

import { CreateReservationDto } from './dto/create-reservation.dto';
import { QueryReservationDto } from './dto/query-reservation.dto';
import { CreateEventPaymentDto } from './dto/create-event-payment.dto';

@ApiTags('Reservas')
@ApiBearerAuth(BEARER_AUTH)
@Controller('reservations')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  // =====================================================
  // CREAR RESERVA
  // =====================================================

  @Post()
  @ApiOperation({
    summary: 'Crear una reserva',
    description:
      'Registra una reserva para un socio en un evento. ' +
      'Los eventos gratuitos se confirman inmediatamente. ' +
      'Los eventos pagados quedan pendientes de pago.',
  })
  @ApiCreatedResponse({
    description: 'Reserva creada correctamente.',
  })
  @ApiBadRequestResponse({
    description:
      'El evento no está disponible, el socio no cumple los requisitos ' +
      'o no existen cupos disponibles.',
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'El evento o el socio no existe.',
    type: ErrorResponseDto,
  })
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateReservationDto,
  ) {
    return this.reservationsService.create(user.gymId, dto);
  }

  // =====================================================
  // LISTAR RESERVAS
  // =====================================================

  @Get()
  @ApiOperation({
    summary: 'Listar reservas',
    description:
      'Devuelve las reservas del gimnasio. Permite filtrar por evento, ' +
      'socio, estado de reserva y estado de pago.',
  })
  @ApiOkResponse({
    description: 'Listado de reservas.',
  })
  @ApiBadRequestResponse({
    description: 'Filtros de búsqueda inválidos.',
    type: ErrorResponseDto,
  })
  async findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: QueryReservationDto,
  ) {
    return this.reservationsService.findAll(user.gymId, query);
  }

  // =====================================================
  // LISTAR RESERVAS DE UN EVENTO
  // =====================================================

  @Get('event/:eventId')
  @ApiOperation({
    summary: 'Listar inscritos de un evento',
    description:
      'Devuelve las reservas no canceladas de un evento, incluyendo ' +
      'los datos de los socios y sus pagos.',
  })
  @ApiParam({
    name: 'eventId',
    description: 'Identificador único del evento.',
    format: 'uuid',
  })
  @ApiOkResponse({
    description: 'Listado de inscritos del evento.',
  })
  @ApiNotFoundResponse({
    description: 'El evento no existe.',
    type: ErrorResponseDto,
  })
  async findByEvent(
    @CurrentUser() user: AuthenticatedUser,
    @Param('eventId') eventId: string,
  ) {
    return this.reservationsService.findByEvent(user.gymId, eventId);
  }

  // =====================================================
  // OBTENER RESERVA
  // =====================================================

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener una reserva',
    description:
      'Devuelve el detalle de una reserva, incluyendo socio, evento y pagos.',
  })
  @ApiParam({
    name: 'id',
    description: 'Identificador único de la reserva.',
    format: 'uuid',
  })
  @ApiOkResponse({
    description: 'Detalle de la reserva.',
  })
  @ApiNotFoundResponse({
    description: 'La reserva no existe.',
    type: ErrorResponseDto,
  })
  async findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.reservationsService.findOne(user.gymId, id);
  }

  // =====================================================
  // CANCELAR RESERVA
  // =====================================================

  @Patch(':id/cancel')
  @ApiOperation({
    summary: 'Cancelar una reserva',
    description:
      'Cancela una reserva y libera el cupo del evento. ' +
      'Los pagos registrados se conservan en el historial.',
  })
  @ApiParam({
    name: 'id',
    description: 'Identificador único de la reserva.',
    format: 'uuid',
  })
  @ApiOkResponse({
    description: 'Reserva cancelada correctamente.',
  })
  @ApiBadRequestResponse({
    description: 'La reserva ya se encuentra cancelada.',
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'La reserva no existe.',
    type: ErrorResponseDto,
  })
  async cancel(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.reservationsService.cancel(user.gymId, id);
  }

  // =====================================================
  // REGISTRAR PAGO
  // =====================================================

  @Post(':id/payments')
  @ApiOperation({
    summary: 'Registrar un pago de reserva',
    description:
      'Registra un pago completo o parcial. Cuando el importe acumulado ' +
      'cubre el precio de la reserva, esta pasa a estado CONFIRMED.',
  })
  @ApiParam({
    name: 'id',
    description: 'Identificador único de la reserva.',
    format: 'uuid',
  })
  @ApiCreatedResponse({
    description: 'Pago registrado correctamente.',
  })
  @ApiBadRequestResponse({
    description:
      'El importe supera el saldo pendiente o la reserva no admite pagos.',
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'La reserva no existe.',
    type: ErrorResponseDto,
  })
  async registerPayment(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: CreateEventPaymentDto,
  ) {
    return this.reservationsService.registerPayment(user.gymId, id, dto);
  }

  // =====================================================
  // HISTORIAL DE PAGOS
  // =====================================================

  @Get(':id/payments')
  @ApiOperation({
    summary: 'Consultar pagos de una reserva',
    description: 'Devuelve el historial de pagos registrados para una reserva.',
  })
  @ApiParam({
    name: 'id',
    description: 'Identificador único de la reserva.',
    format: 'uuid',
  })
  @ApiOkResponse({
    description: 'Historial de pagos.',
  })
  @ApiNotFoundResponse({
    description: 'La reserva no existe.',
    type: ErrorResponseDto,
  })
  async findPayments(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.reservationsService.findPayments(user.gymId, id);
  }
}
