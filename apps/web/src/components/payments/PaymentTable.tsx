import type { Payment } from '../../types/payment';

interface PaymentTableProps {
  payments: Payment[];
  onReverse: (payment: Payment) => void;
  reversing: boolean;
}

const methodLabels: Record<string, string> = {
  CASH: 'Efectivo',
  CARD: 'Tarjeta',
  TRANSFER: 'Transferencia',
  YAPE: 'Yape',
  PLIN: 'Plin',
  OTHER: 'Otro',
};

const formatDate = (value: string) => {
  return new Date(value).toLocaleDateString(
    'es-PE',
    {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    },
  );
};

export function PaymentTable({
  payments,
  onReverse,
  reversing,
}: PaymentTableProps) {
  if (payments.length === 0) {
    return (
      <div className="empty-state">
        No hay pagos registrados.
      </div>
    );
  }

  return (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Miembro</th>
            <th>Membresía</th>
            <th>Monto</th>
            <th>Método</th>
            <th>Referencia</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>

        <tbody>
          {payments.map((payment) => (
            <tr key={payment.id}>
              <td>
                {formatDate(payment.paymentDate)}
              </td>

              <td>
                <strong>
                  {payment.member.firstName}{' '}
                  {payment.member.lastName}
                </strong>

                {payment.member.documentNumber && (
                  <small>
                    {payment.member.documentNumber}
                  </small>
                )}
              </td>

              <td>
                {payment.membership.plan.name}
              </td>

              <td>
                <strong>
                  S/ {Number(payment.amount).toFixed(2)}
                </strong>
              </td>

              <td>
                {methodLabels[payment.method] ??
                  payment.method}
              </td>

              <td>
                {payment.reference || '—'}
              </td>

              <td>
                <span
                  className={`status-badge ${
                    payment.status === 'COMPLETED'
                      ? 'status-active'
                      : 'status-cancelled'
                  }`}
                >
                  {payment.status === 'COMPLETED'
                    ? 'Completado'
                    : 'Reversado'}
                </span>

                {payment.reversalReason && (
                  <div className="table-description">
                    {payment.reversalReason}
                  </div>
                )}
              </td>

              <td>
                {payment.status === 'COMPLETED' && (
                  <div className="table-actions">
                    <button
                      type="button"
                      className="table-action danger"
                      onClick={() => onReverse(payment)}
                      disabled={reversing}
                    >
                      Reversar
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
