import type { Attendance } from './attendance';
import type { Member } from './member';
import type { Membership } from './membership';

export interface DashboardSummary {
  members: {
    total: number;
    active: number;
    inactive: number;
  };

  memberships: {
    active: number;
    expiringSoon: number;
    expired: number;
  };

  expiringMemberships: Membership[];

  recentMembers: Member[];

  attendance: {
    today: number;
    uniqueMembersToday: number;
    last7Days: number;
    month: number;
    daily: Array<{
      date: string;
      count: number;
    }>;
    recent: Attendance[];
  };
}
