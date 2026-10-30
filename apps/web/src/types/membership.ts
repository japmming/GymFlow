export type MembershipStatus =
  | 'ACTIVE'
  | 'EXPIRED'
  | 'CANCELLED';

export interface MembershipMember {
  id: string;
  firstName: string;
  lastName: string;
  documentNumber?: string | null;
}

export interface MembershipPlan {
  id: string;
  name: string;
  durationDays: number;
  price: number | string;
}

export interface Membership {
  id: string;
  memberId: string;
  planId: string;
  startDate: string;
  endDate: string;
  price: number | string;
  paidAmount?: number;
  balance?: number;
  status: MembershipStatus;
  cancelledAt?: string | null;
  cancellationReason?: string | null;
  member: MembershipMember;
  plan: MembershipPlan;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMembershipRequest {
  memberId: string;
  planId: string;
  startDate: string;
}