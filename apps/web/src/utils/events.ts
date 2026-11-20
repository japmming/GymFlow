import type {
  EventStatus,
  EventType,
  GymEvent,
} from '../types/event';

import { formatTime, toLocalDateKey } from './date';

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  CLASS: 'Clase',
  WORKSHOP: 'Taller',
  COMPETITION: 'Competencia',
};

export const EVENT_TYPE_FILTER_LABELS: Record<
  EventType,
  string
> = {
  CLASS: 'Clases',
  WORKSHOP: 'Talleres',
  COMPETITION: 'Competencias',
};

export const EVENT_STATUS_LABELS: Record<
  EventStatus,
  string
> = {
  DRAFT: 'Borrador',
  PUBLISHED: 'Publicado',
  CANCELLED: 'Cancelado',
  COMPLETED: 'Finalizado',
};

export const EVENT_TYPE_OPTIONS: Array<{
  value: EventType;
  label: string;
}> = (
  Object.keys(EVENT_TYPE_LABELS) as EventType[]
).map((value) => ({
  value,
  label: EVENT_TYPE_LABELS[value],
}));

export const EVENT_STATUS_OPTIONS: Array<{
  value: EventStatus;
  label: string;
}> = (
  Object.keys(EVENT_STATUS_LABELS) as EventStatus[]
).map((value) => ({
  value,
  label: EVENT_STATUS_LABELS[value],
}));

export function eventTypeClass(type: EventType): string {
  return `event-type--${type.toLowerCase()}`;
}

export function eventStatusClass(status: EventStatus): string {
  return `status-${status.toLowerCase()}`;
}

const DATE_FORMATTER = new Intl.DateTimeFormat('es-PE', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});

const MONTH_FORMATTER = new Intl.DateTimeFormat('es-PE', {
  month: 'long',
  year: 'numeric',
});

const WEEKDAY_FORMATTER = new Intl.DateTimeFormat('es-PE', {
  weekday: 'short',
});

const MONTH_SHORT_FORMATTER = new Intl.DateTimeFormat('es-PE', {
  month: 'short',
});

const DAY_FORMATTER = new Intl.DateTimeFormat('es-PE', {
  day: '2-digit',
});

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function formatEventDate(value: string): string {
  return capitalize(DATE_FORMATTER.format(new Date(value)));
}

export function formatEventMonth(value: string): string {
  return capitalize(MONTH_FORMATTER.format(new Date(value)));
}

export function formatEventDayParts(value: string): {
  weekday: string;
  day: string;
  month: string;
} {
  const date = new Date(value);

  return {
    weekday: WEEKDAY_FORMATTER.format(date)
      .replace('.', '')
      .toUpperCase(),
    day: DAY_FORMATTER.format(date),
    month: MONTH_SHORT_FORMATTER.format(date)
      .replace('.', '')
      .toUpperCase(),
  };
}

export function formatEventTimeRange(
  startDate: string,
  endDate: string,
): string {
  return `${formatTime(startDate)} – ${formatTime(endDate)}`;
}

export function formatEventDuration(
  startDate: string,
  endDate: string,
): string {
  const minutes = Math.max(
    0,
    Math.round(
      (new Date(endDate).getTime() -
        new Date(startDate).getTime()) /
        60000,
    ),
  );

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours && remainingMinutes) {
    return `${hours} h ${remainingMinutes} min`;
  }

  if (hours) {
    return `${hours} h`;
  }

  return `${remainingMinutes} min`;
}

export function formatEventPrice(
  price: number | string,
): string {
  const amount = Number(price);

  if (!Number.isFinite(amount) || amount <= 0) {
    return 'Gratis';
  }

  return `S/ ${amount.toFixed(2)}`;
}

export function eventMonthKey(value: string): string {
  return toLocalDateKey(value).slice(0, 7);
}

export function isEventPast(event: GymEvent): boolean {
  return new Date(event.endDate).getTime() < Date.now();
}

export function isEventEditable(event: GymEvent): boolean {
  return (
    !isEventPast(event) &&
    event.status !== 'CANCELLED' &&
    event.status !== 'COMPLETED'
  );
}

export function canPublishEvent(event: GymEvent): boolean {
  return event.status === 'DRAFT' && !isEventPast(event);
}

export function canCancelEvent(event: GymEvent): boolean {
  return (
    !isEventPast(event) &&
    event.status !== 'CANCELLED' &&
    event.status !== 'COMPLETED'
  );
}

export function toDateTimeLocalValue(value: string): string {
  const date = new Date(value);

  const pad = (part: number) => String(part).padStart(2, '0');

  return [
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
      date.getDate(),
    )}`,
    `${pad(date.getHours())}:${pad(date.getMinutes())}`,
  ].join('T');
}

export function dateTimeLocalToIso(value: string): string {
  return new Date(value).toISOString();
}
