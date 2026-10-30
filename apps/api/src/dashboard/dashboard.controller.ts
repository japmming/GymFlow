import { Controller, Get } from '@nestjs/common';

import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  async getSummary() {
    const gymId = '00000000-0000-0000-0000-000000000001';

    return this.dashboardService.getSummary(gymId);
  }
}
