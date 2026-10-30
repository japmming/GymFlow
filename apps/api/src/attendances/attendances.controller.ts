import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';

import { AttendancesService } from './attendances.service';
import { CancelAttendanceDto } from './dto/cancel-attendance.dto';
import { CheckInDto } from './dto/check-in.dto';
import { QueryAttendanceDto } from './dto/query-attendance.dto';

@Controller('attendances')
export class AttendancesController {
  constructor(private readonly attendancesService: AttendancesService) {}

  @Get()
  async findAll(@Query() query: QueryAttendanceDto) {
    const gymId = '00000000-0000-0000-0000-000000000001';

    return this.attendancesService.findAll(gymId, query);
  }

  @Post('check-in')
  async checkIn(@Body() dto: CheckInDto) {
    const gymId = '00000000-0000-0000-0000-000000000001';

    return this.attendancesService.checkIn(gymId, dto);
  }

  @Post(':id/cancel')
  async cancel(@Param('id') id: string, @Body() dto: CancelAttendanceDto) {
    const gymId = '00000000-0000-0000-0000-000000000001';

    return this.attendancesService.cancel(gymId, id, dto);
  }

  @Post(':id/restore')
  async restore(@Param('id') id: string) {
    const gymId = '00000000-0000-0000-0000-000000000001';

    return this.attendancesService.restore(gymId, id);
  }
}
