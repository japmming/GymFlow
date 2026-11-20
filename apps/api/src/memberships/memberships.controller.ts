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

import { MembershipsService } from './memberships.service';

import { CancelMembershipDto } from './dto/cancel-membership.dto';
import { CreateMembershipDto } from './dto/create-membership.dto';
import { ErrorResponseDto } from '../swagger/models/common.model';
import { MembershipResponseDto } from '../swagger/models/membership.model';
import { BEARER_AUTH, SWAGGER_TAGS } from '../swagger/swagger.constants';

@ApiTags(SWAGGER_TAGS.MEMBERSHIPS)
@ApiBearerAuth(BEARER_AUTH)
@Controller('memberships')
export class MembershipsController {
  constructor(private readonly membershipsService: MembershipsService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar membresías',
    description:
      'Devuelve las membresías del gimnasio con el socio, el plan y el ' +
      'resumen de pagos (monto pagado y saldo pendiente).',
  })
  @ApiOkResponse({
    description: 'Listado de membresías.',
    type: [MembershipResponseDto],
  })
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.membershipsService.findAll(user.gymId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener una membresía',
    description:
      'Devuelve el detalle de una membresía, su socio, su plan y el resumen ' +
      'de pagos.',
  })
  @ApiParam({
    name: 'id',
    description: 'Identificador único de la membresía.',
    format: 'uuid',
    example: '59fe39ec-28d3-4892-8005-4c61147cdb6b',
  })
  @ApiOkResponse({
    description: 'Detalle de la membresía.',
    type: MembershipResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'La membresía no existe o no pertenece al gimnasio.',
    type: ErrorResponseDto,
  })
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.membershipsService.findOne(user.gymId, id);
  }

  @Post()
  @ApiOperation({
    summary: 'Crear una membresía',
    description:
      'Asocia un plan activo a un socio activo. Si el socio ya tiene una ' +
      'membresía vigente, la nueva comienza al día siguiente de su ' +
      'vencimiento.',
  })
  @ApiCreatedResponse({
    description: 'Membresía creada correctamente.',
    type: MembershipResponseDto,
  })
  @ApiBadRequestResponse({
    description:
      'Fecha de inicio inválida o anterior a hoy, o duración de plan inválida.',
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'El socio o el plan no existen o están inactivos.',
    type: ErrorResponseDto,
  })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateMembershipDto,
  ) {
    return this.membershipsService.create(user.gymId, dto);
  }

  @Roles('ADMIN')
  @Post(':id/cancel')
  @ApiOperation({
    summary: 'Cancelar una membresía',
    description:
      'Cancela una membresía activa y registra el motivo. Requiere rol ADMIN.',
  })
  @ApiParam({
    name: 'id',
    description: 'Identificador único de la membresía.',
    format: 'uuid',
  })
  @ApiCreatedResponse({
    description: 'Membresía cancelada correctamente.',
    type: MembershipResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'El motivo está vacío o la membresía ya está cancelada.',
    type: ErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'Se requiere rol ADMIN.',
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'La membresía no existe.',
    type: ErrorResponseDto,
  })
  cancel(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: CancelMembershipDto,
  ) {
    return this.membershipsService.cancel(user.gymId, id, dto);
  }
}
