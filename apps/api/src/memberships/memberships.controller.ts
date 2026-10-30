import { Body, Controller, Get, Param, Post } from '@nestjs/common';

import { MembershipsService } from './memberships.service';

import { CancelMembershipDto } from './dto/cancel-membership.dto';
import { CreateMembershipDto } from './dto/create-membership.dto';

@Controller('memberships')
export class MembershipsController {
  private readonly gymId = '00000000-0000-0000-0000-000000000001';

  constructor(private readonly membershipsService: MembershipsService) {}

  @Get()
  findAll() {
    return this.membershipsService.findAll(this.gymId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.membershipsService.findOne(this.gymId, id);
  }

  @Post()
  create(@Body() dto: CreateMembershipDto) {
    return this.membershipsService.create(this.gymId, dto);
  }

  @Post(':id/cancel')
  cancel(@Param('id') id: string, @Body() dto: CancelMembershipDto) {
    return this.membershipsService.cancel(this.gymId, id, dto);
  }
}
