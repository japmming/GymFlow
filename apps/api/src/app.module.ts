import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './prisma/prisma.module';
import { MembersModule } from './members/members.module';
import { PlansModule } from './plans/plans.module';
import { MembershipsModule } from './memberships/memberships.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { PaymentsModule } from './payments/payments.module';
import { AttendancesModule } from './attendances/attendances.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { EventsModule } from './events/events.module';
import { ReservationsModule } from './reservations/reservations.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    HealthModule,
    MembersModule,
    PlansModule,
    MembershipsModule,
    DashboardModule,
    PaymentsModule,
    AttendancesModule,
    UsersModule,
    EventsModule,
    ReservationsModule,
  ],
})
export class AppModule {}
