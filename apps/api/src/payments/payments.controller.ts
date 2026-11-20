import { Body, Controller, Get, Param, Post } from '@nestjs/common';
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

import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { ReversePaymentDto } from './dto/reverse-payment.dto';
import { ErrorResponseDto } from '../swagger/models/common.model';
import { PaymentResponseDto } from '../swagger/models/payment.model';
import { BEARER_AUTH, SWAGGER_TAGS } from '../swagger/swagger.constants';

@ApiTags(SWAGGER_TAGS.PAYMENTS)
@ApiBearerAuth(BEARER_AUTH)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar pagos',
    description:
      'Devuelve todos los pagos del gimnasio con el socio y la membresía ' +
      'asociados, ordenados por fecha descendente.',
  })
  @ApiOkResponse({
    description: 'Listado de pagos.',
    type: [PaymentResponseDto],
  })
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.paymentsService.findAll(user.gymId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener un pago',
    description: 'Devuelve el detalle de un pago del gimnasio.',
  })
  @ApiParam({
    name: 'id',
    description: 'Identificador único del pago.',
    format: 'uuid',
    example: 'bca538e5-ce80-4fbc-ad15-54bfc85e2a71',
  })
  @ApiOkResponse({
    description: 'Detalle del pago.',
    type: PaymentResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'El pago no existe o no pertenece al gimnasio.',
    type: ErrorResponseDto,
  })
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.paymentsService.findOne(user.gymId, id);
  }

  @Post()
  @ApiOperation({
    summary: 'Registrar un pago',
    description:
      'Registra un pago sobre una membresía activa. El monto debe ser mayor ' +
      'a cero y no puede superar el saldo pendiente.',
  })
  @ApiCreatedResponse({
    description: 'Pago registrado correctamente.',
    type: PaymentResponseDto,
  })
  @ApiBadRequestResponse({
    description:
      'Monto inválido, saldo insuficiente, membresía cancelada o socio inactivo.',
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'La membresía no existe.',
    type: ErrorResponseDto,
  })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreatePaymentDto,
  ) {
    return this.paymentsService.create(user.gymId, dto);
  }

  @Roles('ADMIN')
  @Post(':id/reverse')
  @ApiOperation({
    summary: 'Reversar un pago',
    description:
      'Marca un pago como REFUNDED y registra el motivo del reverso. ' +
      'Requiere rol ADMIN.',
  })
  @ApiParam({
    name: 'id',
    description: 'Identificador único del pago.',
    format: 'uuid',
  })
  @ApiCreatedResponse({
    description: 'Pago reversado correctamente.',
    type: PaymentResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'El motivo está vacío o el pago ya fue reversado.',
    type: ErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'Se requiere rol ADMIN.',
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'El pago no existe.',
    type: ErrorResponseDto,
  })
  reverse(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: ReversePaymentDto,
  ) {
    return this.paymentsService.reverse(user.gymId, id, dto);
  }
}
