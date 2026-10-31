import {
  formatMoney,
  roundMoney,
  sumCompletedPayments,
  withPaymentSummary,
} from './payment-summary';

describe('payment-summary', () => {
  describe('roundMoney', () => {
    it('redondea a dos decimales sin errores de coma flotante', () => {
      expect(roundMoney(0.1 + 0.2)).toBe(0.3);
      expect(roundMoney(19.905)).toBe(19.91);
      expect(roundMoney(-1.005)).toBe(-1);
    });
  });

  describe('sumCompletedPayments', () => {
    it('solo suma pagos COMPLETED', () => {
      const total = sumCompletedPayments([
        { amount: 20, status: 'COMPLETED' },
        { amount: '10.50', status: 'COMPLETED' },
        { amount: 100, status: 'REFUNDED' },
      ]);

      expect(total).toBe(30.5);
    });

    it('devuelve cero cuando no hay pagos completados', () => {
      expect(sumCompletedPayments([{ amount: 50, status: 'REFUNDED' }])).toBe(
        0,
      );
    });
  });

  describe('withPaymentSummary', () => {
    it('calcula pagado y saldo pendiente', () => {
      const result = withPaymentSummary({
        id: 'membership-1',
        price: '49.90',
        payments: [
          { amount: '30.00', status: 'COMPLETED' },
          { amount: '5.00', status: 'REFUNDED' },
        ],
      });

      expect(result).toEqual({
        id: 'membership-1',
        price: '49.90',
        paidAmount: 30,
        balance: 19.9,
      });
    });

    it('no devuelve saldo negativo cuando hay sobrepago histórico', () => {
      const result = withPaymentSummary({
        price: 50,
        payments: [{ amount: 60, status: 'COMPLETED' }],
      });

      expect(result.paidAmount).toBe(60);
      expect(result.balance).toBe(0);
    });
  });

  describe('formatMoney', () => {
    it('formatea siempre con dos decimales', () => {
      expect(formatMoney(19.9)).toBe('19.90');
      expect(formatMoney(50)).toBe('50.00');
    });
  });
});
