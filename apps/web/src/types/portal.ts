import type { UserRole } from './auth';
import type { MemberStatus } from './member';

export interface MyProfile {
  user: {
    id: string;
    email: string;
    role: UserRole;
  };
  member: {
    id: string;
    firstName: string;
    lastName: string;
    documentNumber: string | null;
    memberCode: string;
    phone: string | null;
    email: string | null;
    status: MemberStatus;
    qrToken: string;
    createdAt: string;
  };
  gym: {
    name: string;
    logoUrl: string | null;
    timezone: string;
    currency: string;
  };
}
