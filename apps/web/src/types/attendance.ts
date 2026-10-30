export interface AttendanceMember {
  id: string;
  firstName: string;
  lastName: string;
  documentNumber?: string | null;
  memberCode?: string | null;
}

export interface AttendancePlan {
  id: string;
  name: string;
  durationDays: number;
  price: number | string;
}

export interface AttendanceMembership {
  id: string;
  startDate: string;
  endDate: string;
  price?: number | string;
  paidAmount?: number;
  balance?: number;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  plan: AttendancePlan;
}

export interface Attendance {
  id: string;
  memberId: string;
  membershipId?: string | null;
  attendanceDate: string;
  checkedInAt: string;
  source?: string | null;
  cancelled: boolean;
  cancelledAt?: string | null;
  cancellationReason?: string | null;
  member: AttendanceMember;
  membership?: AttendanceMembership | null;
}

export interface CheckInRequest {
  qrToken?: string;
  memberCode?: string;
}

export interface AttendancesResponse {
  data: Attendance[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AttendanceFilters {
  from?: string;
  to?: string;
  search?: string;
  page?: number;
  limit?: number;
}
