interface PaymentAmount {
  amount: unknown;
  status: string;
}

interface MembershipWithPayments {
  price: unknown;
  payments: PaymentAmount[];
}

export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function sumCompletedPayments(payments: PaymentAmount[]): number {
  return roundMoney(
    payments
      .filter((payment) => payment.status === 'COMPLETED')
      .reduce((total, payment) => total + Number(payment.amount), 0),
  );
}

export function withPaymentSummary<T extends MembershipWithPayments>(
  membership: T,
) {
  const { payments, ...membershipData } = membership;
  const price = roundMoney(Number(membership.price));
  const paidAmount = sumCompletedPayments(payments);

  return {
    ...membershipData,
    paidAmount,
    balance: roundMoney(Math.max(price - paidAmount, 0)),
  };
}

export function formatMoney(value: number): string {
  return roundMoney(value).toFixed(2);
}
