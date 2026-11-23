import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
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

import { PlansService } from './plans.service';

import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { ErrorResponseDto } from '../swagger/models/common.model';
import { PlanResponseDto } from '../swagger/models/plan.model';
import { BEARER_AUTH, SWAGGER_TAGS } from '../swagger/swagger.constants';

@ApiTags(SWAGGER_TAGS.PLANS)
@ApiBearerAuth(BEARER_AUTH)
@Roles('ADMIN', 'RECEPTION')
@Controller('plans')
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar planes',
    description:
      'Devuelve todos los planes del gimnasio, incluidos los inactivos.',
  })
  @ApiOkResponse({
    description: 'Listado de planes.',
    type: [PlanResponseDto],
  })
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.plansService.findAll(user.gymId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener un plan',
    description: 'Devuelve el detalle de un plan del gimnasio.',
  })
  @ApiParam({
    name: 'id',
    description: 'Identificador único del plan.',
    format: 'uuid',
    example: '8f074fcb-e733-4e06-a898-52f2cfabd3af',
  })
  @ApiOkResponse({
    description: 'Detalle del plan.',
    type: PlanResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'El plan no existe o no pertenece al gimnasio.',
    type: ErrorResponseDto,
  })
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.plansService.findOne(user.gymId, id);
  }

  @Roles('ADMIN')
  @Post()
  @ApiOperation({
    summary: 'Crear un plan',
    description:
      'Crea un plan disponible para nuevas membresías. Requiere rol ADMIN.',
  })
  @ApiCreatedResponse({
    description: 'Plan creado correctamente.',
    type: PlanResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Datos del plan inválidos.',
    type: ErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'Se requiere rol ADMIN.',
    type: ErrorResponseDto,
  })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreatePlanDto) {
    return this.plansService.create(user.gymId, dto);
  }

  @Roles('ADMIN')
  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar un plan',
    description: 'Actualiza parcialmente un plan. Requiere rol ADMIN.',
  })
  @ApiParam({
    name: 'id',
    description: 'Identificador único del plan.',
    format: 'uuid',
  })
  @ApiOkResponse({
    description: 'Plan actualizado correctamente.',
    type: PlanResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Datos del plan inválidos.',
    type: ErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'Se requiere rol ADMIN.',
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'El plan no existe.',
    type: ErrorResponseDto,
  })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdatePlanDto,
  ) {
    return this.plansService.update(user.gymId, id, dto);
  }

  @Roles('ADMIN')
  @Delete(':id')
  @ApiOperation({
    summary: 'Desactivar un plan',
    description:
      'Marca el plan como inactivo para impedir nuevas membresías. Requiere ' +
      'rol ADMIN.',
  })
  @ApiParam({
    name: 'id',
    description: 'Identificador único del plan.',
    format: 'uuid',
  })
  @ApiOkResponse({
    description: 'Plan desactivado correctamente.',
    type: PlanResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'Se requiere rol ADMIN.',
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'El plan no existe.',
    type: ErrorResponseDto,
  })
  deactivate(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.plansService.deactivate(user.gymId, id);
  }

  @Roles('ADMIN')
  @Post(':id/reactivate')
  @ApiOperation({
    summary: 'Reactivar un plan',
    description:
      'Vuelve a habilitar el plan para nuevas membresías. Requiere rol ADMIN.',
  })
  @ApiParam({
    name: 'id',
    description: 'Identificador único del plan.',
    format: 'uuid',
  })
  @ApiCreatedResponse({
    description: 'Plan reactivado correctamente.',
    type: PlanResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'Se requiere rol ADMIN.',
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'El plan no existe.',
    type: ErrorResponseDto,
  })
  reactivate(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.plansService.reactivate(user.gymId, id);
  }
}
