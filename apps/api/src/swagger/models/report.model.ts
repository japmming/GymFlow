import { ApiProperty } from '@nestjs/swagger';

class ReportRangeResponseDto {
  @ApiProperty({ example: '2026-11-16' })
  from!: string;

  @ApiProperty({ example: '2026-11-22' })
  to!: string;

  @ApiProperty({ example: 7 })
  days!: number;

  @ApiProperty({ example: 'America/Lima' })
  timezone!: string;

  @ApiProperty({ example: 'PEN' })
  currency!: string;

  @ApiProperty({
    example: { from: '2026-11-09', to: '2026-11-15' },
  })
  previous!: {
    from: string;
    to: string;
  };
}

class ReportPeakDayDto {
  @ApiProperty({ example: '2026-11-18' })
  date!: string;

  @ApiProperty({ example: 12 })
  count!: number;
}

class ReportPeakHourDto {
  @ApiProperty({ example: '18:00' })
  hour!: string;

  @ApiProperty({ example: 9 })
  count!: number;
}

class ReportAttendanceDto {
  @ApiProperty({ example: 64 })
  total!: number;

  @ApiProperty({ example: 55 })
  previous!: number;

  @ApiProperty({ example: 31 })
  uniqueMembers!: number;

  @ApiProperty({ example: 9.14 })
  averagePerDay!: number;

  @ApiProperty({
    description:
      'Variación porcentual contra el periodo anterior. Null si no hay base.',
    nullable: true,
    example: 16.36,
  })
  changePercent!: number | null;

  @ApiProperty({
    type: ReportPeakDayDto,
    nullable: true,
  })
  peakDay!: ReportPeakDayDto | null;

  @ApiProperty({
    type: ReportPeakHourDto,
    nullable: true,
  })
  peakHour!: ReportPeakHourDto | null;
}

class ReportMembersDto {
  @ApiProperty({ example: 8 })
  new!: number;

  @ApiProperty({ example: 5 })
  previousNew!: number;

  @ApiProperty({ example: 2 })
  deactivated!: number;

  @ApiProperty({ example: 6 })
  netGrowth!: number;

  @ApiProperty({ example: 92 })
  active!: number;

  @ApiProperty({
    nullable: true,
    example: 60,
  })
  changePercent!: number | null;
}

class ReportMembershipsDto {
  @ApiProperty({ example: 74 })
  active!: number;

  @ApiProperty({ example: 9 })
  expiringSoon!: number;
}

class ReportPaymentMethodDto {
  @ApiProperty({ example: 'YAPE' })
  method!: string;

  @ApiProperty({ example: 350 })
  amount!: number;
}

class ReportRevenueDto {
  @ApiProperty({ example: 980 })
  total!: number;

  @ApiProperty({ example: 850 })
  previous!: number;

  @ApiProperty({ example: 800 })
  membership!: number;

  @ApiProperty({ example: 180 })
  events!: number;

  @ApiProperty({
    nullable: true,
    example: 15.29,
  })
  changePercent!: number | null;

  @ApiProperty({
    type: ReportPaymentMethodDto,
    isArray: true,
  })
  byMethod!: ReportPaymentMethodDto[];
}

class ReportRetentionDto {
  @ApiProperty({ example: 8 })
  cohort!: number;

  @ApiProperty({ example: 5 })
  retained7Days!: number;

  @ApiProperty({ example: 7 })
  retained30Days!: number;

  @ApiProperty({ example: 62.5 })
  rate7Days!: number;

  @ApiProperty({ example: 87.5 })
  rate30Days!: number;

  @ApiProperty({ example: 30 })
  windowDays!: number;
}

class ReportDailyDto {
  @ApiProperty({ example: '2026-11-16' })
  date!: string;

  @ApiProperty({ example: 11 })
  attendance!: number;

  @ApiProperty({ example: 2 })
  newMembers!: number;

  @ApiProperty({ example: 1 })
  deactivatedMembers!: number;

  @ApiProperty({ example: 150 })
  revenue!: number;
}

export class ReportResponseDto {
  @ApiProperty({ type: ReportRangeResponseDto })
  range!: ReportRangeResponseDto;

  @ApiProperty({ type: ReportAttendanceDto })
  attendance!: ReportAttendanceDto;

  @ApiProperty({ type: ReportMembersDto })
  members!: ReportMembersDto;

  @ApiProperty({ type: ReportMembershipsDto })
  memberships!: ReportMembershipsDto;

  @ApiProperty({ type: ReportRevenueDto })
  revenue!: ReportRevenueDto;

  @ApiProperty({ type: ReportRetentionDto })
  retention!: ReportRetentionDto;

  @ApiProperty({ type: ReportDailyDto, isArray: true })
  daily!: ReportDailyDto[];

  @ApiProperty({ type: ReportPeakHourDto, isArray: true })
  peakHours!: ReportPeakHourDto[];
}
