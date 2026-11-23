import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
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

import { MembersService } from './members.service';

import { CreateMemberDto } from './dto/create-member.dto';
import { RegenerateQrTokenDto } from './dto/regenerate-qr-token.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { QueryMemberDto } from './dto/query-member.dto';
import { ErrorResponseDto } from '../swagger/models/common.model';
import { PaginatedMembersResponseDto } from '../swagger/models/member-list.model';
import { MemberResponseDto } from '../swagger/models/member.model';
import { BEARER_AUTH, SWAGGER_TAGS } from '../swagger/swagger.constants';

@ApiTags(SWAGGER_TAGS.MEMBERS)
@ApiBearerAuth(BEARER_AUTH)
@Roles('ADMIN', 'RECEPTION')
@Controller('members')
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar socios',
    description:
      'Devuelve los socios del gimnasio de forma paginada. Permite buscar ' +
      'por nombre, apellido, documento, teléfono o código de socio e incluye ' +
      'la última membresía de cada socio.',
  })
  @ApiOkResponse({
    description: 'Listado paginado de socios.',
    type: PaginatedMembersResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Parámetros de búsqueda o paginación inválidos.',
    type: ErrorResponseDto,
  })
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: QueryMemberDto,
  ) {
    return this.membersService.findAll(user.gymId, query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener un socio',
    description: 'Devuelve el detalle de un socio del gimnasio.',
  })
  @ApiParam({
    name: 'id',
    description: 'Identificador único del socio.',
    format: 'uuid',
    example: 'a9d21cf1-8ccf-42a2-92b6-27ace628bb0f',
  })
  @ApiOkResponse({
    description: 'Detalle del socio.',
    type: MemberResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'El socio no existe o no pertenece al gimnasio.',
    type: ErrorResponseDto,
  })
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.membersService.findOne(user.gymId, id);
  }

  @Post()
  @ApiOperation({
    summary: 'Registrar un socio',
    description:
      'Crea un socio activo. Si no se envía memberCode, el sistema genera un ' +
      'código único automáticamente.',
  })
  @ApiCreatedResponse({
    description: 'Socio registrado correctamente.',
    type: MemberResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Datos del socio inválidos.',
    type: ErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'Ya existe un socio con el mismo documento o código.',
    type: ErrorResponseDto,
  })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateMemberDto) {
    return this.membersService.create(user.gymId, dto);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar un socio',
    description:
      'Actualiza parcialmente los datos de un socio. Solo se modifican los ' +
      'campos enviados.',
  })
  @ApiParam({
    name: 'id',
    description: 'Identificador único del socio.',
    format: 'uuid',
  })
  @ApiOkResponse({
    description: 'Socio actualizado correctamente.',
    type: MemberResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Datos del socio inválidos.',
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'El socio no existe.',
    type: ErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'Ya existe otro socio con el mismo documento o código.',
    type: ErrorResponseDto,
  })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateMemberDto,
  ) {
    return this.membersService.update(user.gymId, id, dto);
  }

  @Roles('ADMIN')
  @Delete(':id')
  @ApiOperation({
    summary: 'Desactivar un socio',
    description:
      'Cambia el estado del socio a INACTIVE. Requiere rol ADMIN. El historial ' +
      'de membresías, pagos y asistencias se conserva.',
  })
  @ApiParam({
    name: 'id',
    description: 'Identificador único del socio.',
    format: 'uuid',
  })
  @ApiOkResponse({
    description: 'Socio desactivado correctamente.',
    type: MemberResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'Se requiere rol ADMIN.',
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'El socio no existe.',
    type: ErrorResponseDto,
  })
  deactivate(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.membersService.deactivate(user.gymId, id);
  }

  @Roles('ADMIN')
  @Post(':id/reactivate')
  @ApiOperation({
    summary: 'Reactivar un socio',
    description: 'Cambia el estado del socio a ACTIVE. Requiere rol ADMIN.',
  })
  @ApiParam({
    name: 'id',
    description: 'Identificador único del socio.',
    format: 'uuid',
  })
  @ApiCreatedResponse({
    description: 'Socio reactivado correctamente.',
    type: MemberResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'Se requiere rol ADMIN.',
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'El socio no existe.',
    type: ErrorResponseDto,
  })
  reactivate(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.membersService.reactivate(user.gymId, id);
  }

  @Post(':id/qr-token/regenerate')
  @ApiOperation({
    summary: 'Regenerar el token QR',
    description:
      'Genera un nuevo token QR para el socio e invalida el anterior. El ' +
      'motivo queda registrado para auditoría.',
  })
  @ApiParam({
    name: 'id',
    description: 'Identificador único del socio.',
    format: 'uuid',
  })
  @ApiCreatedResponse({
    description: 'Token QR regenerado correctamente.',
    type: MemberResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'El motivo enviado no es válido.',
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'El socio no existe.',
    type: ErrorResponseDto,
  })
  regenerateQrToken(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: RegenerateQrTokenDto,
  ) {
    return this.membersService.regenerateQrToken(user.gymId, id, dto);
  }
}
