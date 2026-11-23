import { Module } from '@nestjs/common';

import { EventsModule } from '../events/events.module';
import { ReservationsModule } from '../reservations/reservations.module';

import { PortalController } from './portal.controller';
import { PortalService } from './portal.service';

@Module({
  imports: [EventsModule, ReservationsModule],
  controllers: [PortalController],
  providers: [PortalService],
})
export class PortalModule {}
