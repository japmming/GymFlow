import {
  addDaysToDateKey,
  todayDateKey,
} from './date';

import type { ReportPreset } from '../types/report';

export interface ReportDateRange {
  from: string;
  to: string;
}

export const REPORT_PRESETS: {
  value: ReportPreset;
  label: string;
  days: number;
}[] = [
  { value: '7d', label: 'Últimos 7 días', days: 7 },
  { value: '14d', label: 'Últimos 14 días', days: 14 },
  { value: '30d', label: 'Últimos 30 días', days: 30 },
];

export function resolvePresetRange(
  preset: ReportPreset,
): ReportDateRange {
  const to = todayDateKey();
  const days =
    REPORT_PRESETS.find((item) => item.value === preset)?.days ?? 7;

  return {
    from: addDaysToDateKey(to, -(days - 1)),
    to,
  };
}

export function formatReportMoney(
  amount: number,
  currency: string,
): string {
  return `${currency} ${amount.toFixed(2)}`;
}

export function formatReportDate(dateKey: string): string {
  const [year, month, day] = dateKey.split('-').map(Number);

  return new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    month: 'short',
  }).format(new Date(year, month - 1, day));
}

export function formatReportDelta(
  value: number | null,
): string {
  if (value === null) {
    return 'Sin comparativa';
  }

  if (Math.abs(value) < 0.05) {
    return '0.0%';
  }

  return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
}

export function reportDeltaClass(value: number | null): string {
  if (value === null || Math.abs(value) < 0.05) {
    return 'delta delta--neutral';
  }

  return value > 0 ? 'delta delta--up' : 'delta delta--down';
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH: 'Efectivo',
  CARD: 'Tarjeta',
  TRANSFER: 'Transferencia',
  YAPE: 'Yape',
  PLIN: 'Plin',
  OTHER: 'Otro',
};

export function formatPaymentMethod(method: string): string {
  return PAYMENT_METHOD_LABELS[method] ?? method;
}
