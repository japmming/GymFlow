import type { Payment } from '../../types/payment';
import { EmptyState } from '../ui/EmptyState';

interface PaymentTableProps {
  payments: Payment[];
  canReverse: boolean;
  onReverse: (payment: Payment) => void;
  reversingId: string | null;
}

const methodLabels: Record<string, string> = {
  CASH: 'Efectivo',
  CARD: 'Tarjeta',
  TRANSFER: 'Transferencia',
  YAPE: 'Yape',
  PLIN: 'Plin',
  OTHER: 'Otro',
};

const DATE_FORMATTER = new Intl.DateTimeFormat('es-PE', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const formatDate = (value: string) => {
  return DATE_FORMATTER.format(new Date(value));
};

export function PaymentTable({
  payments,
  canReverse,
  onReverse,
  reversingId,
}: PaymentTableProps) {
  if (payments.length === 0) {
    return (
      <EmptyState
        icon="🧾"
        title="No hay pagos registrados"
        description="Los pagos que registres aparecerán aquí."
      />
    );
  }

  return (
    <div className="table-container">
      <table>
        <caption className="sr-only">
          Historial de pagos registrados
        </caption>
        <thead>
          <tr>
            <th scope="col">Fecha</th>
            <th scope="col">Miembro</th>
            <th scope="col">Membresía</th>
            <th scope="col" className="table-number">
              Monto
            </th>
            <th scope="col">Método</th>
            <th scope="col">Referencia</th>
            <th scope="col">Estado</th>
            <th scope="col">Acciones</th>
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

              <td className="table-number">
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
                {canReverse && payment.status === 'COMPLETED' && (
                  <div className="table-actions">
                    <button
                      type="button"
                      className="table-action danger"
                      onClick={() => onReverse(payment)}
                      disabled={reversingId === payment.id}
                      aria-label={`Reversar el pago de ${payment.member.firstName} ${payment.member.lastName}`}
                    >
                      {reversingId === payment.id
                        ? 'Reversando...'
                        : 'Reversar'}
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
