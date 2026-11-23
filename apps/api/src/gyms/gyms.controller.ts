import { Body, Controller, Get, Patch } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import type { AuthenticatedUser } from '../auth/authenticated-user';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { ErrorResponseDto } from '../swagger/models/common.model';
import { GymSettingsResponseDto } from '../swagger/models/gym.model';
import { BEARER_AUTH, SWAGGER_TAGS } from '../swagger/swagger.constants';

import { UpdateGymDto } from './dto/update-gym.dto';
import { GymsService } from './gyms.service';

@ApiTags(SWAGGER_TAGS.GYMS)
@ApiBearerAuth(BEARER_AUTH)
@Roles('ADMIN')
@Controller('gym')
export class GymsController {
  constructor(private readonly gymsService: GymsService) {}

  @Get()
  @ApiOperation({
    summary: 'Obtener la configuración del gimnasio',
    description:
      'Devuelve la identidad, zona horaria, moneda, logo y horarios del ' +
      'gimnasio asociado al usuario autenticado. Requiere rol ADMIN.',
  })
  @ApiOkResponse({
    description: 'Configuración actual del gimnasio.',
    type: GymSettingsResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'Se requiere rol ADMIN.',
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'El gimnasio no existe.',
    type: ErrorResponseDto,
  })
  findOne(@CurrentUser() user: AuthenticatedUser) {
    return this.gymsService.findOne(user.gymId);
  }

  @Patch()
  @ApiOperation({
    summary: 'Actualizar la configuración del gimnasio',
    description:
      'Actualiza cualquier combinación de nombre, slug, zona horaria, ' +
      'moneda, logo y horarios de atención. Requiere rol ADMIN.',
  })
  @ApiOkResponse({
    description: 'Configuración actualizada del gimnasio.',
    type: GymSettingsResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Datos de configuración inválidos.',
    type: ErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'Se requiere rol ADMIN.',
    type: ErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'Ya existe otro gimnasio con ese slug.',
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'El gimnasio no existe.',
    type: ErrorResponseDto,
  })
  update(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateGymDto) {
    return this.gymsService.update(user.gymId, dto);
  }
}
