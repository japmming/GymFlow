import { useMemo } from 'react';

import type { Payment } from '../../types/payment';
import { toLocalDateKey } from '../../utils/date';

const MONTH_FORMATTER = new Intl.DateTimeFormat('es-PE', {
  month: 'short',
});

const CURRENCY_FORMATTER = new Intl.NumberFormat('es-PE', {
  style: 'currency',
  currency: 'PEN',
  maximumFractionDigits: 0,
});

function formatMoney(value: number) {
  return CURRENCY_FORMATTER.format(value);
}

function formatCompactMoney(value: number) {
  if (value >= 1000) {
    const thousands = value / 1000;

    return `S/ ${thousands.toFixed(
      value >= 10000 ? 0 : 1,
    )}k`;
  }

  return `S/ ${Math.round(value)}`;
}

function getMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(
    date.getMonth() + 1,
  ).padStart(2, '0')}`;
}

function getLastMonths(count: number) {
  const now = new Date();

  return Array.from({ length: count }, (_, index) => {
    const date = new Date(
      now.getFullYear(),
      now.getMonth() - (count - 1 - index),
      1,
    );

    return {
      key: getMonthKey(date),
      label: MONTH_FORMATTER.format(date).replace('.', ''),
    };
  });
}

export function RevenueChart({
  payments,
}: {
  payments: Payment[];
}) {
  const months = useMemo(() => {
    const base = getLastMonths(6);

    const completed = payments.filter(
      (payment) => payment.status === 'COMPLETED',
    );

    return base.map((month) => ({
      ...month,
      total: completed
        .filter(
          (payment) =>
            toLocalDateKey(payment.paymentDate).slice(
              0,
              7,
            ) === month.key,
        )
        .reduce(
          (sum, payment) =>
            sum + Number(payment.amount ?? 0),
          0,
        ),
    }));
  }, [payments]);

  const currentMonth = months[months.length - 1];
  const previousMonth = months[months.length - 2];
  const maxTotal = Math.max(
    ...months.map((month) => month.total),
    1,
  );

  const delta =
    previousMonth && previousMonth.total > 0
      ? ((currentMonth.total - previousMonth.total) /
          previousMonth.total) *
        100
      : null;

  const chartLabel = months
    .map(
      (month) =>
        `${month.label}: ${formatMoney(month.total)}`,
    )
    .join(', ');

  return (
    <section className="dashboard-card revenue-card">
      <div className="card-head">
        <div>
          <h2>Ingresos</h2>
          <p>Últimos 6 meses · pagos completados</p>
        </div>

        <div className="revenue-summary">
          <strong>{formatMoney(currentMonth.total)}</strong>
          <span>este mes</span>

          {delta !== null && (
            <span
              className={
                delta >= 0
                  ? 'delta delta--up'
                  : 'delta delta--down'
              }
            >
              {delta >= 0 ? '+' : '−'}
              {Math.abs(delta).toFixed(1)}%
            </span>
          )}
        </div>
      </div>

      <div className="card-body">
        <div
          className="revenue-chart"
          role="img"
          aria-label={`Ingresos mensuales. ${chartLabel}.`}
        >
          <div className="revenue-plot">
            {months.map((month, index) => {
              const isCurrent = index === months.length - 1;
              const height =
                month.total > 0
                  ? Math.max(
                      (month.total / maxTotal) * 100,
                      6,
                    )
                  : 2;

              return (
                <div
                  className="revenue-bar-group"
                  key={month.key}
                  title={`${month.label}: ${formatMoney(
                    month.total,
                  )}`}
                >
                  <div className="revenue-bar-track">
                    <div
                      className={
                        isCurrent
                          ? 'revenue-bar is-current'
                          : 'revenue-bar'
                      }
                      style={{ height: `${height}%` }}
                    >
                      <span className="revenue-bar-value">
                        {formatCompactMoney(month.total)}
                      </span>
                    </div>
                  </div>

                  <span className="revenue-bar-label">
                    {month.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <p className="card-footnote">
          Los ingresos se calculan con pagos completados y
          no incluyen devoluciones.
        </p>
      </div>
    </section>
  );
}
