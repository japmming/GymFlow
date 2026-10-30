import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';

import { PlansService } from './plans.service';

import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';

@Controller('plans')
export class PlansController {
  private readonly gymId = '00000000-0000-0000-0000-000000000001';

  constructor(private readonly plansService: PlansService) {}

  @Get()
  findAll() {
    return this.plansService.findAll(this.gymId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.plansService.findOne(this.gymId, id);
  }

  @Post()
  create(@Body() dto: CreatePlanDto) {
    return this.plansService.create(this.gymId, dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePlanDto) {
    return this.plansService.update(this.gymId, id, dto);
  }

  @Delete(':id')
  deactivate(@Param('id') id: string) {
    return this.plansService.deactivate(this.gymId, id);
  }

  @Post(':id/reactivate')
  reactivate(@Param('id') id: string) {
    return this.plansService.reactivate(this.gymId, id);
  }
}
