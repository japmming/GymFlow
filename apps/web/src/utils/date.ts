const DAY_MS = 1000 * 60 * 60 * 24;
const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function toDateKey(value: string): string {
  const key = value.slice(0, 10);

  if (!DATE_KEY_PATTERN.test(key)) {
    throw new Error('La fecha no tiene el formato esperado.');
  }

  return key;
}

export function toLocalDateKey(value: Date | string): string {
  const date = typeof value === 'string' ? new Date(value) : value;

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function todayDateKey(): string {
  return toLocalDateKey(new Date());
}

export function addDaysToDateKey(
  value: string,
  days: number,
): string {
  const [year, month, day] = toDateKey(value)
    .split('-')
    .map(Number);

  const date = new Date(Date.UTC(year, month - 1, day));

  date.setUTCDate(date.getUTCDate() + days);

  return date.toISOString().slice(0, 10);
}

export function daysBetweenDateKeys(
  start: string,
  end: string,
): number {
  const [startYear, startMonth, startDay] = toDateKey(start)
    .split('-')
    .map(Number);
  const [endYear, endMonth, endDay] = toDateKey(end)
    .split('-')
    .map(Number);

  const startTime = Date.UTC(
    startYear,
    startMonth - 1,
    startDay,
  );
  const endTime = Date.UTC(endYear, endMonth - 1, endDay);

  return Math.round((endTime - startTime) / DAY_MS);
}

export function formatDateOnly(value: string): string {
  const [year, month, day] = toDateKey(value)
    .split('-')
    .map(Number);

  return new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(year, month - 1, day));
}

export function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export function formatTime(value: string): string {
  return new Intl.DateTimeFormat('es-PE', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}
