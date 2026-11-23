import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import type { AuthenticatedUser } from '../auth/authenticated-user';
import { BEARER_AUTH, SWAGGER_TAGS } from '../swagger/swagger.constants';
import {
  ErrorResponseDto,
  SuccessResponseDto,
} from '../swagger/models/common.model';
import {
  MemberActivityDto,
  MemberNoteDto,
} from '../swagger/models/member-note.model';

import { CreateMemberNoteDto } from './dto/create-member-note.dto';
import { UpdateMemberNoteDto } from './dto/update-member-note.dto';
import { MemberNotesService } from './member-notes.service';

@ApiTags(SWAGGER_TAGS.CRM)
@ApiBearerAuth(BEARER_AUTH)
@Roles('ADMIN', 'RECEPTION')
@Controller('members/:memberId')
export class MemberNotesController {
  constructor(private readonly memberNotesService: MemberNotesService) {}

  @Get('notes')
  @ApiOperation({ summary: 'Lista las notas CRM de un socio.' })
  @ApiParam({ name: 'memberId', format: 'uuid' })
  @ApiOkResponse({ type: [MemberNoteDto] })
  @ApiForbiddenResponse({ type: ErrorResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Param('memberId') memberId: string,
  ) {
    return this.memberNotesService.findAll(user.gymId, memberId);
  }

  @Post('notes')
  @ApiOperation({ summary: 'Crea una nota CRM para un socio.' })
  @ApiParam({ name: 'memberId', format: 'uuid' })
  @ApiCreatedResponse({ type: MemberNoteDto })
  @ApiBadRequestResponse({ type: ErrorResponseDto })
  @ApiForbiddenResponse({ type: ErrorResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('memberId') memberId: string,
    @Body() dto: CreateMemberNoteDto,
  ) {
    return this.memberNotesService.create(user.gymId, memberId, user.id, dto);
  }

  @Patch('notes/:noteId')
  @ApiOperation({ summary: 'Edita una nota CRM de un socio.' })
  @ApiParam({ name: 'memberId', format: 'uuid' })
  @ApiParam({ name: 'noteId', format: 'uuid' })
  @ApiOkResponse({ type: MemberNoteDto })
  @ApiBadRequestResponse({ type: ErrorResponseDto })
  @ApiForbiddenResponse({ type: ErrorResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('memberId') memberId: string,
    @Param('noteId') noteId: string,
    @Body() dto: UpdateMemberNoteDto,
  ) {
    return this.memberNotesService.update(user.gymId, memberId, noteId, dto);
  }

  @Delete('notes/:noteId')
  @ApiOperation({ summary: 'Elimina una nota CRM de un socio.' })
  @ApiParam({ name: 'memberId', format: 'uuid' })
  @ApiParam({ name: 'noteId', format: 'uuid' })
  @ApiOkResponse({ type: SuccessResponseDto })
  @ApiForbiddenResponse({ type: ErrorResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('memberId') memberId: string,
    @Param('noteId') noteId: string,
  ) {
    return this.memberNotesService.remove(user.gymId, memberId, noteId);
  }

  @Get('activity')
  @ApiOperation({
    summary:
      'Devuelve el historial reciente del socio: notas, ingresos, pagos, membresías y reservas.',
  })
  @ApiParam({ name: 'memberId', format: 'uuid' })
  @ApiOkResponse({ type: [MemberActivityDto] })
  @ApiForbiddenResponse({ type: ErrorResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  getActivity(
    @CurrentUser() user: AuthenticatedUser,
    @Param('memberId') memberId: string,
  ) {
    return this.memberNotesService.getActivity(user.gymId, memberId);
  }
}
