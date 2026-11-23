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
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import type { AuthenticatedUser } from '../auth/authenticated-user';

import { EventsService } from './events.service';

import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { QueryEventDto } from './dto/query-event.dto';
import { ErrorResponseDto } from '../swagger/models/common.model';
import { EventResponseDto } from '../swagger/models/event.model';
import { BEARER_AUTH, SWAGGER_TAGS } from '../swagger/swagger.constants';

@ApiTags(SWAGGER_TAGS.EVENTS)
@ApiBearerAuth(BEARER_AUTH)
@Roles('ADMIN', 'RECEPTION')
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar eventos',
    description:
      'Devuelve los eventos del gimnasio. Permite filtrar por tipo, estado, ' +
      'texto y rango de fechas.',
  })
  @ApiOkResponse({
    description: 'Listado de eventos.',
    type: [EventResponseDto],
  })
  @ApiBadRequestResponse({
    description: 'Filtros de evento inválidos.',
    type: ErrorResponseDto,
  })
  async findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: QueryEventDto,
  ) {
    return this.eventsService.findAll(user.gymId, query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener un evento',
    description: 'Devuelve el detalle de un evento del gimnasio.',
  })
  @ApiParam({
    name: 'id',
    description: 'Identificador único del evento.',
    format: 'uuid',
    example: '1b6f4e1a-6a4b-4f1e-9f0b-2a6c3d8e9f10',
  })
  @ApiOkResponse({
    description: 'Detalle del evento.',
    type: EventResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'El evento no existe.',
    type: ErrorResponseDto,
  })
  async findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.eventsService.findOne(user.gymId, id);
  }

  @Post()
  @ApiOperation({
    summary: 'Crear un evento',
    description:
      'Crea un evento en estado DRAFT. La fecha de finalización debe ser ' +
      'posterior a la de inicio.',
  })
  @ApiCreatedResponse({
    description: 'Evento creado correctamente.',
    type: EventResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Datos del evento inválidos o fechas inconsistentes.',
    type: ErrorResponseDto,
  })
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateEventDto,
  ) {
    return this.eventsService.create(user.gymId, dto);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar un evento',
    description:
      'Actualiza parcialmente un evento en borrador o publicado. No se ' +
      'pueden modificar eventos cancelados o finalizados.',
  })
  @ApiParam({
    name: 'id',
    description: 'Identificador único del evento.',
    format: 'uuid',
  })
  @ApiOkResponse({
    description: 'Evento actualizado correctamente.',
    type: EventResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Datos inválidos, fechas inconsistentes o evento no editable.',
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'El evento no existe.',
    type: ErrorResponseDto,
  })
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateEventDto,
  ) {
    return this.eventsService.update(user.gymId, id, dto);
  }

  @Patch(':id/publish')
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Publicar un evento',
    description:
      'Publica un evento que esté en estado DRAFT y cuya fecha de ' +
      'finalización aún no haya pasado. Requiere rol ADMIN.',
  })
  @ApiParam({
    name: 'id',
    description: 'Identificador único del evento.',
    format: 'uuid',
  })
  @ApiOkResponse({
    description: 'Evento publicado correctamente.',
    type: EventResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'El evento no está en borrador o ya finalizó.',
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'El evento no existe.',
    type: ErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'Se requiere rol ADMIN.',
    type: ErrorResponseDto,
  })
  async publish(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.eventsService.publish(user.gymId, id);
  }

  @Patch(':id/cancel')
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Cancelar un evento',
    description:
      'Cancela un evento que no esté ya cancelado o finalizado. Requiere ' +
      'rol ADMIN.',
  })
  @ApiParam({
    name: 'id',
    description: 'Identificador único del evento.',
    format: 'uuid',
  })
  @ApiOkResponse({
    description: 'Evento cancelado correctamente.',
    type: EventResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'El evento ya está cancelado o finalizado.',
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'El evento no existe.',
    type: ErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'Se requiere rol ADMIN.',
    type: ErrorResponseDto,
  })
  async cancel(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.eventsService.cancel(user.gymId, id);
  }
}
