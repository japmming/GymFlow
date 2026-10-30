import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import { MembersService } from './members.service';

import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { QueryMemberDto } from './dto/query-member.dto';

@Controller('members')
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  // Temporalmente utilizaremos este gimnasio.
  // Más adelante vendrá del usuario autenticado.
  private readonly gymId = '00000000-0000-0000-0000-000000000001';

  @Get()
  findAll(@Query() query: QueryMemberDto) {
    return this.membersService.findAll(this.gymId, query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.membersService.findOne(this.gymId, id);
  }

  @Post()
  create(@Body() dto: CreateMemberDto) {
    return this.membersService.create(this.gymId, dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateMemberDto) {
    return this.membersService.update(this.gymId, id, dto);
  }

  @Delete(':id')
  deactivate(@Param('id') id: string) {
    return this.membersService.deactivate(this.gymId, id);
  }

  @Post(':id/reactivate')
  reactivate(@Param('id') id: string) {
    return this.membersService.reactivate(this.gymId, id);
  }
}
