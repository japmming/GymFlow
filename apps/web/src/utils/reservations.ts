import type {
  EventPaymentMethod,
  Reservation,
  ReservationPaymentStatus,
  ReservationStatus,
} from '../types/reservation';

import { formatDateTime } from './date';

export const RESERVATION_STATUS_LABELS: Record<
  ReservationStatus,
  string
> = {
  PENDING_PAYMENT: 'Pendiente de pago',
  CONFIRMED: 'Confirmada',
  CANCELLED: 'Cancelada',
};

export const RESERVATION_PAYMENT_STATUS_LABELS: Record<
  ReservationPaymentStatus,
  string
> = {
  NOT_REQUIRED: 'Sin pago',
  PENDING: 'Pendiente',
  PARTIALLY_PAID: 'Pago parcial',
  PAID: 'Pagado',
};

export const PAYMENT_METHOD_LABELS: Record<
  EventPaymentMethod,
  string
> = {
  CASH: 'Efectivo',
  CARD: 'Tarjeta',
  TRANSFER: 'Transferencia',
  YAPE: 'Yape',
  PLIN: 'Plin',
  OTHER: 'Otro',
};

export const PAYMENT_METHOD_OPTIONS: Array<{
  value: EventPaymentMethod;
  label: string;
}> = (
  Object.keys(PAYMENT_METHOD_LABELS) as EventPaymentMethod[]
).map((value) => ({
  value,
  label: PAYMENT_METHOD_LABELS[value],
}));

export function reservationStatusClass(
  status: ReservationStatus,
): string {
  if (status === 'CONFIRMED') {
    return 'status-active';
  }

  return `status-${status.toLowerCase().replace('_', '-')}`;
}

export function reservationPaymentStatusClass(
  status: ReservationPaymentStatus,
): string {
  return `status-${status.toLowerCase().replace('_', '-')}`;
}

export function formatCurrency(value: number | string): string {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return 'S/ 0.00';
  }

  return `S/ ${amount.toFixed(2)}`;
}

export function formatMemberName(
  member: Pick<Reservation['member'], 'firstName' | 'lastName'>,
): string {
  return `${member.firstName} ${member.lastName}`.trim();
}

export function formatReservedAt(reservation: Reservation): string {
  return formatDateTime(reservation.reservedAt);
}

function roundAmount(value: number): number {
  return Math.round(value * 100) / 100;
}

export function getPaidAmount(reservation: Reservation): number {
  return roundAmount(
    reservation.payments
      .filter((payment) => payment.status === 'COMPLETED')
      .reduce((total, payment) => total + Number(payment.amount), 0),
  );
}

export function getPendingAmount(reservation: Reservation): number {
  return roundAmount(
    Math.max(0, Number(reservation.amount) - getPaidAmount(reservation)),
  );
}

export function isReservationActive(
  reservation: Reservation,
): boolean {
  return reservation.status !== 'CANCELLED';
}

export function canRegisterPayment(
  reservation: Reservation,
): boolean {
  return (
    isReservationActive(reservation) &&
    reservation.paymentStatus !== 'NOT_REQUIRED' &&
    reservation.paymentStatus !== 'PAID' &&
    getPendingAmount(reservation) > 0
  );
}

export function canCancelReservation(
  reservation: Reservation,
): boolean {
  return isReservationActive(reservation);
}
