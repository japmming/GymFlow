import type { Member } from '../../types/member';
import { useState } from 'react';
import { formatDateOnly } from '../../utils/date';
import { getMembershipState } from '../../utils/membershipStatus';
import { MemberQr } from './MemberQr';

interface MemberTableProps {
  members: Member[];
  onEdit: (member: Member) => void;
  onDeactivate: (member: Member) => void;
  onReactivate: (member: Member) => void;
}

export function MemberTable({
  members,
  onEdit,
  onDeactivate,
  onReactivate,
}: MemberTableProps) {
  const [selectedMemberQr, setSelectedMemberQr] = useState<Member | null>(null);

  if (members.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">👤</div>

        <h3>No hay socios</h3>

        <p>
          No encontramos socios que coincidan con tu búsqueda.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="table-container">
        <table className="members-table">
        <thead>
          <tr>
            <th>Socio</th>
            <th>DNI</th>
            <th>Código</th>
            <th>Teléfono</th>
            <th>Correo</th>
            <th>Membresía</th>
            <th>Estado</th>
            <th></th>
          </tr>
        </thead>

        <tbody>
          {members.map((member) => {
            const membershipState = getMembershipState(
              member.latestMembership,
            );

            const membershipDateLabel =
              membershipState.key === 'EXPIRED'
                ? 'Venció'
                : membershipState.key === 'SCHEDULED'
                  ? 'Inicia'
                  : 'Vence';

            return (
              <tr key={member.id}>
                <td>
                  <div className="member-name">
                    <div className="member-avatar">
                      {member.firstName.charAt(0)}
                      {member.lastName.charAt(0)}
                    </div>

                    <div>
                      <strong>
                        {member.firstName} {member.lastName}
                      </strong>
                    </div>
                  </div>
                </td>

                <td>
                  {member.documentNumber ?? '—'}
                </td>

                <td>
                  <span className="member-code">
                    {member.memberCode}
                  </span>
                </td>

                <td>
                  {member.phone ?? '—'}
                </td>

                <td>
                  {member.email ?? '—'}
                </td>

                <td>
                  <span
                    className={`status-badge ${membershipState.className}`}
                  >
                    {membershipState.label}
                  </span>

                  {member.latestMembership &&
                    membershipState.key !== 'CANCELLED' && (
                      <small>
                        {membershipDateLabel}{' '}
                        {formatDateOnly(
                          membershipState.key === 'SCHEDULED'
                            ? member.latestMembership.startDate
                            : member.latestMembership.endDate,
                        )}
                      </small>
                    )}
                </td>

                <td>
                  <span
                    className={`status-badge ${
                      member.status === 'ACTIVE'
                        ? 'status-active'
                        : 'status-inactive'
                    }`}
                  >
                    {member.status === 'ACTIVE'
                      ? 'Activo'
                      : 'Inactivo'}
                  </span>
                </td>

                <td>
                  <div className="table-actions">
                    <button
                      className="table-action"
                      onClick={() => onEdit(member)}
                    >
                      Editar
                    </button>

                    {member.status === 'ACTIVE' && (
                      <button
                        className="table-action danger"
                        onClick={() => onDeactivate(member)}
                      >
                        Desactivar
                      </button>
                    )}

                    {member.status === 'INACTIVE' && (
                      <button
                        className="table-action"
                        onClick={() => onReactivate(member)}
                      >
                        Reactivar
                      </button>
                    )}
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() =>
                        setSelectedMemberQr(member)
                      }
                    >
                      Ver QR
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
        </table>
      </div>
      {selectedMemberQr && (
        <MemberQr
          memberName={`${selectedMemberQr.firstName} ${selectedMemberQr.lastName}`}
          qrToken={selectedMemberQr.qrToken}
          onClose={() => setSelectedMemberQr(null)}
        />
      )}
    </>
  );
}
