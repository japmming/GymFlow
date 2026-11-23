import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import type { AuthenticatedUser } from '../auth/authenticated-user';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { ErrorResponseDto } from '../swagger/models/common.model';
import { ReportResponseDto } from '../swagger/models/report.model';
import { BEARER_AUTH, SWAGGER_TAGS } from '../swagger/swagger.constants';

import { QueryReportDto } from './dto/query-report.dto';
import { ReportsService } from './reports.service';

@ApiTags(SWAGGER_TAGS.REPORTS)
@ApiBearerAuth(BEARER_AUTH)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Obtener el reporte operativo del gimnasio',
    description:
      'Devuelve asistencias, altas y bajas, ingresos, retención, ' +
      'horarios pico y una serie diaria para el rango solicitado. ' +
      'El rango por defecto son los últimos 7 días.',
  })
  @ApiOkResponse({
    description: 'Reporte operativo del rango seleccionado.',
    type: ReportResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'El rango de fechas no es válido.',
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Token ausente, inválido o expirado.',
    type: ErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'El usuario no tiene permisos de administrador.',
    type: ErrorResponseDto,
  })
  getReport(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: QueryReportDto,
  ) {
    return this.reportsService.getReport(user.gymId, query);
  }
}
