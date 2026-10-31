import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';

import type { AuthenticatedUser } from '../auth/authenticated-user';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';

import { AttendancesService } from './attendances.service';
import { CancelAttendanceDto } from './dto/cancel-attendance.dto';
import { CheckInDto } from './dto/check-in.dto';
import { QueryAttendanceDto } from './dto/query-attendance.dto';

@Controller('attendances')
export class AttendancesController {
  constructor(private readonly attendancesService: AttendancesService) {}

  @Get()
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: QueryAttendanceDto,
  ) {
    return this.attendancesService.findAll(user.gymId, query);
  }

  @Post('check-in')
  checkIn(@CurrentUser() user: AuthenticatedUser, @Body() dto: CheckInDto) {
    return this.attendancesService.checkIn(user.gymId, dto);
  }

  @Roles('ADMIN')
  @Post(':id/cancel')
  cancel(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: CancelAttendanceDto,
  ) {
    return this.attendancesService.cancel(user.gymId, id, dto);
  }

  @Roles('ADMIN')
  @Post(':id/restore')
  restore(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.attendancesService.restore(user.gymId, id);
  }
}
