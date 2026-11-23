import { Module } from '@nestjs/common';

import { MemberNotesController } from './member-notes.controller';
import { MemberNotesService } from './member-notes.service';

@Module({
  controllers: [MemberNotesController],
  providers: [MemberNotesService],
})
export class CrmModule {}
