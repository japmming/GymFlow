import type { Membership } from '../../types/membership';
import { formatDateOnly } from '../../utils/date';
import { getMembershipState } from '../../utils/membershipStatus';
import { EmptyState } from '../ui/EmptyState';

interface MembershipTableProps {
  memberships: Membership[];
  canCancel: boolean;
  onCancel: (membership: Membership) => void;
  cancellingId: string | null;
}

export function MembershipTable({
  memberships,
  canCancel,
  onCancel,
  cancellingId,
}: MembershipTableProps) {
  if (memberships.length === 0) {
    return (
      <EmptyState
        icon="🎫"
        title="No hay membresías registradas"
        description="Asocia un plan a un socio para comenzar."
      />
    );
  }

  return (
    <div className="table-container">
      <table>
        <caption className="sr-only">
          Membresías registradas
        </caption>
        <thead>
          <tr>
            <th scope="col">Miembro</th>
            <th scope="col">Plan</th>
            <th scope="col">Inicio</th>
            <th scope="col">Vencimiento</th>
            <th scope="col" className="table-number">
              Precio
            </th>
            <th scope="col" className="table-number">
              Pagado
            </th>
            <th scope="col" className="table-number">
              Saldo
            </th>
            <th scope="col">Estado</th>
            <th scope="col">Acciones</th>
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

                <td className="table-number">
                  S/ {price.toFixed(2)}
                </td>

                <td className="table-number">
                  S/ {paidAmount.toFixed(2)}
                </td>

                <td className="table-number">
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
                  {canCancel &&
                    membership.status !==
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
                        aria-label={`Cancelar la membresía de ${membership.member.firstName} ${membership.member.lastName}`}
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
