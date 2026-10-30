import type { Membership } from '../../types/membership';
import { formatDateOnly } from '../../utils/date';
import { getMembershipState } from '../../utils/membershipStatus';

interface MembershipTableProps {
  memberships: Membership[];
  onCancel: (membership: Membership) => void;
  cancellingId: string | null;
}

export function MembershipTable({
  memberships,
  onCancel,
  cancellingId,
}: MembershipTableProps) {
  if (memberships.length === 0) {
    return (
      <div className="empty-state">
        No hay membresías registradas.
      </div>
    );
  }

  return (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            <th>Miembro</th>
            <th>Plan</th>
            <th>Inicio</th>
            <th>Vencimiento</th>
            <th>Precio</th>
            <th>Pagado</th>
            <th>Saldo</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>

        <tbody>
          {memberships.map((membership) => {
            const membershipState =
              getMembershipState(membership);

            const price = Number(
              membership.price ??
                membership.plan.price,
            );
            const paidAmount = Number(
              membership.paidAmount ?? 0,
            );
            const balance = Number(
              membership.balance ??
                Math.max(price - paidAmount, 0),
            );

            return (
              <tr key={membership.id}>
                <td>
                  <strong>
                    {membership.member.firstName}{' '}
                    {membership.member.lastName}
                  </strong>

                  {membership.member
                    .documentNumber && (
                    <div className="table-description">
                      DNI: {membership.member.documentNumber}
                    </div>
                  )}
                </td>

                <td>
                  {membership.plan.name}
                </td>

                <td>
                  {formatDateOnly(
                    membership.startDate,
                  )}
                </td>

                <td>
                  {formatDateOnly(
                    membership.endDate,
                  )}
                </td>

                <td>
                  S/ {price.toFixed(2)}
                </td>

                <td>
                  S/ {paidAmount.toFixed(2)}
                </td>

                <td>
                  <strong>
                    S/ {balance.toFixed(2)}
                  </strong>
                </td>

                <td>
                  <span
                    className={`status-badge ${membershipState.className}`}
                  >
                    {membershipState.label}
                  </span>

                  {membership.cancellationReason && (
                    <div className="table-description">
                      {membership.cancellationReason}
                    </div>
                  )}
                </td>

                <td>
                  {membership.status !==
                    'CANCELLED' && (
                    <div className="table-actions">
                      <button
                        type="button"
                        className="table-action danger"
                        onClick={() =>
                          onCancel(membership)
                        }
                        disabled={
                          cancellingId ===
                          membership.id
                        }
                      >
                        {cancellingId ===
                        membership.id
                          ? 'Cancelando...'
                          : 'Cancelar'}
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
