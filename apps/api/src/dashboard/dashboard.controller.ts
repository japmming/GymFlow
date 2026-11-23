import { Controller, Get } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import type { AuthenticatedUser } from '../auth/authenticated-user';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';

import { DashboardService } from './dashboard.service';
import { ErrorResponseDto } from '../swagger/models/common.model';
import { DashboardSummaryResponseDto } from '../swagger/models/dashboard.model';
import { BEARER_AUTH, SWAGGER_TAGS } from '../swagger/swagger.constants';

@ApiTags(SWAGGER_TAGS.DASHBOARD)
@ApiBearerAuth(BEARER_AUTH)
@Roles('ADMIN', 'RECEPTION')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @ApiOperation({
    summary: 'Obtener el resumen del panel',
    description:
      'Devuelve los indicadores consolidados del gimnasio: socios, ' +
      'membresías por vencer, últimas altas, asistencias del día y serie ' +
      'diaria de los últimos 7 días.',
  })
  @ApiOkResponse({
    description: 'Resumen consolidado del gimnasio.',
    type: DashboardSummaryResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Token ausente, inválido o expirado.',
    type: ErrorResponseDto,
  })
  getSummary(@CurrentUser() user: AuthenticatedUser) {
    return this.dashboardService.getSummary(user.gymId);
  }
}
