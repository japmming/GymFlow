import {
  addDaysToDateKey,
  compareDateKeys,
  dateKeyInTimeZone,
  dateToDateKey,
  parseDateKey,
  startOfDayInTimeZone,
  timeInTimeZone,
} from './date.utils';

describe('date.utils', () => {
  describe('parseDateKey', () => {
    it('convierte una fecha YYYY-MM-DD a medianoche UTC', () => {
      const date = parseDateKey('2026-10-30');

      expect(date.toISOString()).toBe('2026-10-30T00:00:00.000Z');
    });

    it('acepta el 29 de febrero de un año bisiesto', () => {
      expect(() => parseDateKey('2024-02-29')).not.toThrow();
    });

    it('rechaza fechas con formato inválido', () => {
      expect(() => parseDateKey('30/10/2026')).toThrow(
        'La fecha debe tener el formato YYYY-MM-DD.',
      );
    });

    it('rechaza fechas de calendario inexistentes', () => {
      expect(() => parseDateKey('2026-02-29')).toThrow(
        'La fecha ingresada no es válida.',
      );
      expect(() => parseDateKey('2026-13-01')).toThrow(
        'La fecha ingresada no es válida.',
      );
    });
  });

  describe('timeInTimeZone', () => {
    it('convierte un instante UTC a la hora local de la zona', () => {
      expect(
        timeInTimeZone(new Date('2026-11-20T15:30:00.000Z'), 'America/Lima'),
      ).toBe('10:30');
    });

    it('respeta el cambio de día en la zona horaria', () => {
      expect(
        dateKeyInTimeZone(new Date('2026-11-20T03:30:00.000Z'), 'America/Lima'),
      ).toBe('2026-11-19');
    });
  });

  describe('startOfDayInTimeZone', () => {
    it('calcula el inicio local de Lima en UTC', () => {
      expect(
        startOfDayInTimeZone('2026-11-20', 'America/Lima').toISOString(),
      ).toBe('2026-11-20T05:00:00.000Z');
    });

    it('calcula el inicio local de una zona con hora adelantada', () => {
      expect(
        startOfDayInTimeZone('2026-11-20', 'Asia/Shanghai').toISOString(),
      ).toBe('2026-11-19T16:00:00.000Z');
    });
  });

  describe('dateToDateKey', () => {
    it('no cambia de día al convertir una fecha @db.Date', () => {
      expect(dateToDateKey(parseDateKey('2026-01-01'))).toBe('2026-01-01');
      expect(dateToDateKey(parseDateKey('2026-12-31'))).toBe('2026-12-31');
    });
  });

  describe('addDaysToDateKey', () => {
    it('cruza el fin de mes y de año', () => {
      expect(addDaysToDateKey('2026-10-31', 1)).toBe('2026-11-01');
      expect(addDaysToDateKey('2026-12-31', 1)).toBe('2027-01-01');
    });

    it('resta días cruzando el inicio de mes', () => {
      expect(addDaysToDateKey('2026-03-01', -1)).toBe('2026-02-28');
    });

    it('respeta los años bisiestos', () => {
      expect(addDaysToDateKey('2024-02-28', 1)).toBe('2024-02-29');
      expect(addDaysToDateKey('2024-02-29', 1)).toBe('2024-03-01');
    });
  });

  describe('compareDateKeys', () => {
    it('ordena fechas YYYY-MM-DD como texto', () => {
      expect(compareDateKeys('2026-10-30', '2026-10-31')).toBeLessThan(0);
      expect(compareDateKeys('2026-11-01', '2026-10-31')).toBeGreaterThan(0);
      expect(compareDateKeys('2026-10-30', '2026-10-30')).toBe(0);
    });
  });

  describe('dateKeyInTimeZone', () => {
    it('usa el día local de America/Lima (UTC-5)', () => {
      expect(
        dateKeyInTimeZone(new Date('2026-10-31T04:30:00.000Z'), 'America/Lima'),
      ).toBe('2026-10-30');
    });

    it('cambia de día exactamente a medianoche local', () => {
      expect(
        dateKeyInTimeZone(new Date('2026-10-30T04:59:59.999Z'), 'America/Lima'),
      ).toBe('2026-10-29');

      expect(
        dateKeyInTimeZone(new Date('2026-10-30T05:00:00.000Z'), 'America/Lima'),
      ).toBe('2026-10-30');
    });
  });
});
