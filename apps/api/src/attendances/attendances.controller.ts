import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
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

import { AttendancesService } from './attendances.service';
import { CancelAttendanceDto } from './dto/cancel-attendance.dto';
import { CheckInDto } from './dto/check-in.dto';
import { QueryAttendanceDto } from './dto/query-attendance.dto';
import {
  AttendanceResponseDto,
  CheckInResponseDto,
} from '../swagger/models/attendance.model';
import { ErrorResponseDto } from '../swagger/models/common.model';
import { PaginatedAttendancesResponseDto } from '../swagger/models/pagination.model';
import { BEARER_AUTH, SWAGGER_TAGS } from '../swagger/swagger.constants';

@ApiTags(SWAGGER_TAGS.ATTENDANCES)
@ApiBearerAuth(BEARER_AUTH)
@Controller('attendances')
export class AttendancesController {
  constructor(private readonly attendancesService: AttendancesService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar asistencias',
    description:
      'Devuelve las asistencias de forma paginada. Permite filtrar por rango ' +
      'de fechas y buscar por datos del socio.',
  })
  @ApiOkResponse({
    description: 'Listado paginado de asistencias.',
    type: PaginatedAttendancesResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Rango de fechas inválido o parámetros incorrectos.',
    type: ErrorResponseDto,
  })
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: QueryAttendanceDto,
  ) {
    return this.attendancesService.findAll(user.gymId, query);
  }

  @Post('check-in')
  @ApiOperation({
    summary: 'Registrar un check-in',
    description:
      'Registra el ingreso de un socio mediante su token QR o su código de ' +
      'socio. El socio debe estar activo, tener una membresía vigente con al ' +
      'menos un pago registrado y no haber ingresado todavía ese día.',
  })
  @ApiCreatedResponse({
    description: 'Check-in registrado correctamente.',
    type: CheckInResponseDto,
  })
  @ApiBadRequestResponse({
    description:
      'No se envió QR ni código, se enviaron ambos, el socio está inactivo, ' +
      'no tiene membresía vigente o no tiene pagos registrados.',
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'El código QR o el código de socio no es válido.',
    type: ErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'El socio ya registró su asistencia el día de hoy.',
    type: ErrorResponseDto,
  })
  checkIn(@CurrentUser() user: AuthenticatedUser, @Body() dto: CheckInDto) {
    return this.attendancesService.checkIn(user.gymId, dto);
  }

  @Roles('ADMIN')
  @Post(':id/cancel')
  @ApiOperation({
    summary: 'Anular una asistencia',
    description:
      'Anula una asistencia registrada y guarda el motivo. Requiere rol ADMIN.',
  })
  @ApiParam({
    name: 'id',
    description: 'Identificador único de la asistencia.',
    format: 'uuid',
    example: '48ad1bf3-7194-46a1-9b7a-048e18e3569b',
  })
  @ApiCreatedResponse({
    description: 'Asistencia anulada correctamente.',
    type: AttendanceResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'El motivo está vacío o la asistencia ya está anulada.',
    type: ErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'Se requiere rol ADMIN.',
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'La asistencia no existe.',
    type: ErrorResponseDto,
  })
  cancel(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: CancelAttendanceDto,
  ) {
    return this.attendancesService.cancel(user.gymId, id, dto);
  }

  @Roles('ADMIN')
  @Post(':id/restore')
  @ApiOperation({
    summary: 'Restaurar una asistencia',
    description:
      'Vuelve a activar una asistencia anulada si el socio no tiene otro ' +
      'ingreso activo ese mismo día. Requiere rol ADMIN.',
  })
  @ApiParam({
    name: 'id',
    description: 'Identificador único de la asistencia.',
    format: 'uuid',
  })
  @ApiCreatedResponse({
    description: 'Asistencia restaurada correctamente.',
    type: AttendanceResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'La asistencia no está anulada.',
    type: ErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'Se requiere rol ADMIN.',
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'La asistencia no existe.',
    type: ErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'El socio ya tiene una asistencia activa para ese día.',
    type: ErrorResponseDto,
  })
  restore(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.attendancesService.restore(user.gymId, id);
  }
}
