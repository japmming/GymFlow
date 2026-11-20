import type { GymEvent } from './event';
import type { Member } from './member';
import type { PaymentMethod } from './payment';

export type ReservationStatus =
  | 'PENDING_PAYMENT'
  | 'CONFIRMED'
  | 'CANCELLED';

export type ReservationPaymentStatus =
  | 'NOT_REQUIRED'
  | 'PENDING'
  | 'PARTIALLY_PAID'
  | 'PAID';

export type EventPaymentStatus = 'COMPLETED' | 'REFUNDED';

export type EventPaymentMethod = PaymentMethod;

export interface EventPayment {
  id: string;
  gymId: string;
  reservationId: string;
  amount: number | string;
  method: EventPaymentMethod;
  reference: string | null;
  notes: string | null;
  status: EventPaymentStatus;
  paymentDate: string;
  createdAt: string;
}

export interface Reservation {
  id: string;
  gymId: string;
  eventId: string;
  memberId: string;
  amount: number | string;
  status: ReservationStatus;
  paymentStatus: ReservationPaymentStatus;
  reservedAt: string;
  paidAt: string | null;
  cancelledAt: string | null;
  member: Member;
  event?: GymEvent;
  payments: EventPayment[];
}

export interface ReservationFilters {
  eventId?: string;
  memberId?: string;
  status?: ReservationStatus;
  paymentStatus?: ReservationPaymentStatus;
}

export interface CreateReservationRequest {
  eventId: string;
  memberId: string;
}

export interface CreateEventPaymentRequest {
  amount: number;
  method: EventPaymentMethod;
  reference?: string;
  notes?: string;
}

export interface RegisterPaymentResponse {
  payment: EventPayment;
  reservation: Reservation;
  paidAmount: string;
  balance: string;
}
