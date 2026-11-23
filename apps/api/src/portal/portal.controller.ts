import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

import type { AuthenticatedUser } from '../auth/authenticated-user';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { EventResponseDto } from '../swagger/models/event.model';
import { ErrorResponseDto } from '../swagger/models/common.model';
import { MembershipResponseDto } from '../swagger/models/membership.model';
import { PaymentResponseDto } from '../swagger/models/payment.model';
import { MyProfileDto } from '../swagger/models/portal.model';
import { BEARER_AUTH, SWAGGER_TAGS } from '../swagger/swagger.constants';

import { CreateMyReservationDto } from './dto/create-my-reservation.dto';
import { PortalService } from './portal.service';

@ApiTags(SWAGGER_TAGS.PORTAL)
@ApiBearerAuth(BEARER_AUTH)
@Roles('MEMBER')
@Controller('me')
export class PortalController {
  constructor(private readonly portalService: PortalService) {}

  @Get()
  @ApiOperation({ summary: 'Perfil del socio vinculado a la cuenta.' })
  @ApiOkResponse({ type: MyProfileDto })
  @ApiForbiddenResponse({ type: ErrorResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  getProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.portalService.getProfile(user);
  }

  @Get('membership')
  @ApiOperation({ summary: 'Membresía vigente del socio con su saldo.' })
  @ApiOkResponse({ type: MembershipResponseDto, nullable: true })
  @ApiForbiddenResponse({ type: ErrorResponseDto })
  getMembership(@CurrentUser() user: AuthenticatedUser) {
    return this.portalService.getMembership(user);
  }

  @Get('payments')
  @ApiOperation({ summary: 'Historial de pagos de membresía del socio.' })
  @ApiOkResponse({ type: [PaymentResponseDto] })
  @ApiForbiddenResponse({ type: ErrorResponseDto })
  getPayments(@CurrentUser() user: AuthenticatedUser) {
    return this.portalService.getPayments(user);
  }

  @Get('reservations')
  @ApiOperation({ summary: 'Inscripciones a eventos del socio.' })
  @ApiOkResponse({ description: 'Listado de reservas del socio.' })
  @ApiForbiddenResponse({ type: ErrorResponseDto })
  getReservations(@CurrentUser() user: AuthenticatedUser) {
    return this.portalService.getReservations(user);
  }

  @Get('events')
  @ApiOperation({ summary: 'Eventos publicados y próximos del gimnasio.' })
  @ApiOkResponse({ type: [EventResponseDto] })
  @ApiForbiddenResponse({ type: ErrorResponseDto })
  getEvents(@CurrentUser() user: AuthenticatedUser) {
    return this.portalService.getEvents(user);
  }

  @Post('reservations')
  @ApiOperation({ summary: 'Inscribe al socio autenticado en un evento.' })
  @ApiCreatedResponse({ description: 'Reserva creada.' })
  @ApiBadRequestResponse({ type: ErrorResponseDto })
  @ApiForbiddenResponse({ type: ErrorResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  createReservation(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateMyReservationDto,
  ) {
    return this.portalService.createReservation(user, dto.eventId);
  }

  @Patch('reservations/:id/cancel')
  @ApiOperation({ summary: 'Cancela una reserva propia del socio.' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Reserva cancelada.' })
  @ApiBadRequestResponse({ type: ErrorResponseDto })
  @ApiForbiddenResponse({ type: ErrorResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  cancelReservation(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.portalService.cancelReservation(user, id);
  }
}
