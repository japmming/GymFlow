export type PaymentMethod =
  | 'CASH'
  | 'CARD'
  | 'TRANSFER'
  | 'YAPE'
  | 'PLIN'
  | 'OTHER';

export interface PaymentMember {
  id: string;
  firstName: string;
  lastName: string;
  documentNumber?: string | null;
}

export interface PaymentPlan {
  id: string;
  name: string;
  durationDays: number;
  price: number | string;
}

export interface PaymentMembership {
  id: string;
  startDate: string;
  endDate: string;
  price?: number | string;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  plan: PaymentPlan;
}

export interface Payment {
  id: string;
  memberId: string;
  membershipId: string;
  amount: number | string;
  paymentDate: string;
  method: PaymentMethod;
  status: 'COMPLETED' | 'REFUNDED';
  reference?: string | null;
  notes?: string | null;
  reversedAt?: string | null;
  reversalReason?: string | null;
  member: PaymentMember;
  membership: PaymentMembership;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaymentRequest {
  membershipId: string;
  amount: number;
  paymentDate?: string;
  method: PaymentMethod;
  reference?: string;
  notes?: string;
}