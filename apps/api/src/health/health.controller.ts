import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { Public } from '../auth/decorators/public.decorator';
import { HealthResponseDto } from '../swagger/models/common.model';
import { SWAGGER_TAGS } from '../swagger/swagger.constants';

@ApiTags(SWAGGER_TAGS.HEALTH)
@Controller('health')
export class HealthController {
  @Public()
  @Get()
  @ApiOperation({
    summary: 'Comprobar el estado del servicio',
    description:
      'Endpoint público que confirma que la API está en ejecución. No ' +
      'requiere autenticación.',
  })
  @ApiOkResponse({
    description: 'Servicio disponible.',
    type: HealthResponseDto,
  })
  getHealth() {
    return {
      status: 'ok',
      service: 'gymflow-api',
      timestamp: new Date().toISOString(),
    };
  }
}
