import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
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

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import type { AuthenticatedUser } from '../auth/authenticated-user';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';
import { ErrorResponseDto } from '../swagger/models/common.model';
import { UserResponseDto } from '../swagger/models/user.model';
import { BEARER_AUTH, SWAGGER_TAGS } from '../swagger/swagger.constants';

@ApiTags(SWAGGER_TAGS.USERS)
@ApiBearerAuth(BEARER_AUTH)
@Roles('ADMIN')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar usuarios',
    description:
      'Devuelve los usuarios internos del gimnasio sin exponer sus ' +
      'contraseñas. Requiere rol ADMIN.',
  })
  @ApiOkResponse({
    description: 'Listado de usuarios.',
    type: [UserResponseDto],
  })
  @ApiForbiddenResponse({
    description: 'Se requiere rol ADMIN.',
    type: ErrorResponseDto,
  })
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.findAll(user.gymId);
  }

  @Post()
  @ApiOperation({
    summary: 'Crear un usuario',
    description:
      'Crea un usuario interno con rol ADMIN o RECEPTION. Requiere rol ADMIN.',
  })
  @ApiCreatedResponse({
    description: 'Usuario creado correctamente.',
    type: UserResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Datos del usuario inválidos.',
    type: ErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'Se requiere rol ADMIN.',
    type: ErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'Ya existe un usuario con ese correo en el gimnasio.',
    type: ErrorResponseDto,
  })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateUserDto) {
    return this.usersService.create(user.gymId, dto);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar un usuario',
    description:
      'Actualiza datos, rol, estado o contraseña de un usuario. Requiere rol ' +
      'ADMIN. No es posible quitarse el rol de administrador ni desactivar el ' +
      'propio usuario, y siempre debe quedar al menos un ADMIN activo.',
  })
  @ApiParam({
    name: 'id',
    description: 'Identificador único del usuario.',
    format: 'uuid',
    example: '6f0f4e1a-6a4b-4f1e-9f0b-2a6c3d8e9f10',
  })
  @ApiOkResponse({
    description: 'Usuario actualizado correctamente.',
    type: UserResponseDto,
  })
  @ApiBadRequestResponse({
    description:
      'Datos inválidos, intento de degradar al propio administrador o de ' +
      'dejar el gimnasio sin administradores activos.',
    type: ErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'Se requiere rol ADMIN.',
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'El usuario no existe.',
    type: ErrorResponseDto,
  })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.update(user.gymId, id, dto, user.id);
  }
}
