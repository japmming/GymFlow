import type {
  MembershipPlan,
  MembershipStatus,
} from './membership';

export type MemberStatus = 'ACTIVE' | 'INACTIVE';

export interface LatestMembership {
  id: string;
  startDate: string;
  endDate: string;
  price?: number | string;
  status: MembershipStatus;
  plan: MembershipPlan;
}

export interface Member {
  id: string;
  gymId: string;
  firstName: string;
  lastName: string;
  documentNumber: string | null;
  memberCode: string;
  phone: string | null;
  email: string | null;
  status: MemberStatus;
  qrToken: string;
  latestMembership?: LatestMembership | null;
  createdAt: string;
  updatedAt: string;
}

export interface MembersResponse {
  data: Member[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateMemberRequest {
  firstName: string;
  lastName: string;
  documentNumber?: string;
  memberCode?: string;
  phone?: string;
  email?: string;
}

export interface UpdateMemberRequest {
  firstName?: string;
  lastName?: string;
  documentNumber?: string;
  memberCode?: string;
  phone?: string;
  email?: string;
}
