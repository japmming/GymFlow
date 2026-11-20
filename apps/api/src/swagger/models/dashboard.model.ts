import { ApiProperty } from '@nestjs/swagger';

import { AttendanceResponseDto } from './attendance.model';
import { MemberResponseDto } from './member.model';
import { MembershipWithMemberDto } from './membership.model';

export class DashboardMembersDto {
  @ApiProperty({ description: 'Total de socios registrados.', example: 13 })
  total!: number;

  @ApiProperty({ description: 'Socios con estado activo.', example: 11 })
  active!: number;

  @ApiProperty({ description: 'Socios con estado inactivo.', example: 2 })
  inactive!: number;
}

export class DashboardMembershipsDto {
  @ApiProperty({
    description: 'Membresías activas y vigentes al día de hoy.',
    example: 6,
  })
  active!: number;

  @ApiProperty({
    description: 'Membresías que vencen en los próximos 7 días.',
    example: 1,
  })
  expiringSoon!: number;

  @ApiProperty({
    description: 'Socios activos sin una membresía vigente.',
    example: 6,
  })
  expired!: number;
}

export class DashboardAttendanceDayDto {
  @ApiProperty({
    description: 'Día en formato YYYY-MM-DD.',
    example: '2026-11-11',
  })
  date!: string;

  @ApiProperty({ description: 'Asistencias registradas ese día.', example: 4 })
  count!: number;
}

export class DashboardAttendanceDto {
  @ApiProperty({ description: 'Asistencias registradas hoy.', example: 0 })
  today!: number;

  @ApiProperty({
    description: 'Socios distintos que asistieron hoy.',
    example: 0,
  })
  uniqueMembersToday!: number;

  @ApiProperty({
    description: 'Asistencias en los últimos 7 días.',
    example: 9,
  })
  last7Days!: number;

  @ApiProperty({
    description: 'Asistencias acumuladas en el mes actual.',
    example: 9,
  })
  month!: number;

  @ApiProperty({
    description: 'Serie diaria de los últimos 7 días.',
    type: [DashboardAttendanceDayDto],
  })
  daily!: DashboardAttendanceDayDto[];

  @ApiProperty({
    description: 'Últimos check-ins registrados.',
    type: [AttendanceResponseDto],
  })
  recent!: AttendanceResponseDto[];
}

export class DashboardSummaryResponseDto {
  @ApiProperty({
    description: 'Resumen de socios.',
    type: DashboardMembersDto,
  })
  members!: DashboardMembersDto;

  @ApiProperty({
    description: 'Resumen de membresías.',
    type: DashboardMembershipsDto,
  })
  memberships!: DashboardMembershipsDto;

  @ApiProperty({
    description: 'Membresías que vencen en los próximos 7 días.',
    type: [MembershipWithMemberDto],
  })
  expiringMemberships!: MembershipWithMemberDto[];

  @ApiProperty({
    description: 'Últimos socios registrados.',
    type: [MemberResponseDto],
  })
  recentMembers!: MemberResponseDto[];

  @ApiProperty({
    description: 'Indicadores de asistencia.',
    type: DashboardAttendanceDto,
  })
  attendance!: DashboardAttendanceDto;
}
