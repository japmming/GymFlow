export interface ReportRange {
  from: string;
  to: string;
  days: number;
  timezone: string;
  currency: string;
  previous: {
    from: string;
    to: string;
  };
}

export interface ReportPeak {
  date?: string;
  hour?: string;
  count: number;
}

export interface ReportSummary {
  attendance: {
    total: number;
    previous: number;
    uniqueMembers: number;
    averagePerDay: number;
    changePercent: number | null;
    peakDay: ReportPeak | null;
    peakHour: ReportPeak | null;
  };
  members: {
    new: number;
    previousNew: number;
    deactivated: number;
    netGrowth: number;
    active: number;
    changePercent: number | null;
  };
  memberships: {
    active: number;
    expiringSoon: number;
  };
  revenue: {
    total: number;
    previous: number;
    membership: number;
    events: number;
    changePercent: number | null;
    byMethod: {
      method: string;
      amount: number;
    }[];
  };
  retention: {
    cohort: number;
    retained7Days: number;
    retained30Days: number;
    rate7Days: number;
    rate30Days: number;
    windowDays: number;
  };
}

export interface ReportDailyPoint {
  date: string;
  attendance: number;
  newMembers: number;
  deactivatedMembers: number;
  revenue: number;
}

export interface ReportsResponse extends ReportSummary {
  range: ReportRange;
  daily: ReportDailyPoint[];
  peakHours: ReportPeak[];
}

export type ReportPreset = '7d' | '14d' | '30d' | 'custom';
