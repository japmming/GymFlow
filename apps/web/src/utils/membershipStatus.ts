import type { MembershipStatus } from '../types/membership';
import {
  daysBetweenDateKeys,
  toDateKey,
  toLocalDateKey,
} from './date';

export type MembershipState =
  | 'ACTIVE'
  | 'EXPIRING'
  | 'EXPIRED'
  | 'SCHEDULED'
  | 'CANCELLED'
  | 'NONE';

export interface MembershipStateInfo {
  key: MembershipState;
  label: string;
  className: string;
  daysRemaining: number | null;
}

interface MembershipLike {
  status: MembershipStatus;
  startDate: string;
  endDate: string;
}

export function getMembershipState(
  membership?: MembershipLike | null,
  now: Date = new Date(),
): MembershipStateInfo {
  if (!membership) {
    return {
      key: 'NONE',
      label: 'Sin membresía',
      className: 'status-none',
      daysRemaining: null,
    };
  }

  if (membership.status === 'CANCELLED') {
    return {
      key: 'CANCELLED',
      label: 'Cancelada',
      className: 'status-cancelled',
      daysRemaining: null,
    };
  }

  const todayKey = toLocalDateKey(now);
  const startKey = toDateKey(membership.startDate);
  const endKey = toDateKey(membership.endDate);
  const daysRemaining = daysBetweenDateKeys(
    todayKey,
    endKey,
  );

  if (
    membership.status === 'EXPIRED' ||
    endKey < todayKey
  ) {
    return {
      key: 'EXPIRED',
      label: 'Vencida',
      className: 'status-expired',
      daysRemaining,
    };
  }

  if (startKey > todayKey) {
    return {
      key: 'SCHEDULED',
      label: 'Programada',
      className: 'status-scheduled',
      daysRemaining,
    };
  }

  if (daysRemaining <= 7) {
    return {
      key: 'EXPIRING',
      label: 'Por vencer',
      className: 'status-expiring',
      daysRemaining,
    };
  }

  return {
    key: 'ACTIVE',
    label: 'Vigente',
    className: 'status-active',
    daysRemaining,
  };
}
