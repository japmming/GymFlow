export const DEFAULT_TIME_ZONE = 'America/Lima';

const DATE_KEY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isDateKey(value: string): boolean {
  return DATE_KEY_PATTERN.test(value);
}

/**
 * Convierte una fecha YYYY-MM-DD en el Date que Prisma usa para @db.Date.
 * El Date se crea a medianoche UTC para que la fecha no cambie de día.
 */
export function parseDateKey(value: string): Date {
  const match = DATE_KEY_PATTERN.exec(value);

  if (!match) {
    throw new Error('La fecha debe tener el formato YYYY-MM-DD.');
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new Error('La fecha ingresada no es válida.');
  }

  return date;
}

/**
 * Devuelve la clave YYYY-MM-DD de un valor @db.Date.
 */
export function dateToDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Devuelve la fecha local de una zona horaria concreta.
 */
export function dateKeyInTimeZone(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;

  if (!year || !month || !day) {
    throw new Error('No se pudo calcular la fecha local.');
  }

  return `${year}-${month}-${day}`;
}

export function todayDateKey(timeZone: string): string {
  return dateKeyInTimeZone(new Date(), timeZone);
}

export function addDaysToDateKey(value: string, days: number): string {
  const date = parseDateKey(value);

  date.setUTCDate(date.getUTCDate() + days);

  return dateToDateKey(date);
}

export function compareDateKeys(left: string, right: string): number {
  return left.localeCompare(right);
}

export function daysBetweenDateKeys(start: string, end: string): number {
  const startDate = parseDateKey(start);
  const endDate = parseDateKey(end);

  return Math.round(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
  );
}
