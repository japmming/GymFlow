import type { Member } from '../../types/member';
import { useState } from 'react';
import { formatDateOnly } from '../../utils/date';
import { getMembershipState } from '../../utils/membershipStatus';
import { EmptyState } from '../ui/EmptyState';
import { MemberQr } from './MemberQr';

interface MemberTableProps {
  members: Member[];
  canManage: boolean;
  onEdit: (member: Member) => void;
  onOpenCrm: (member: Member) => void;
  onDeactivate: (member: Member) => void;
  onReactivate: (member: Member) => void;
}

export function MemberTable({
  members,
  canManage,
  onEdit,
  onOpenCrm,
  onDeactivate,
  onReactivate,
}: MemberTableProps) {
  const [selectedMemberQr, setSelectedMemberQr] = useState<Member | null>(null);

  if (members.length === 0) {
    return (
      <EmptyState
        icon="👤"
        title="No hay socios"
        description="No hay socios registrados o ninguno coincide con la búsqueda."
      />
    );
  }

  return (
    <>
      <div className="table-container">
        <table className="members-table">
        <caption className="sr-only">
          Listado de socios registrados
        </caption>
        <thead>
          <tr>
            <th scope="col">Socio</th>
            <th scope="col">DNI</th>
            <th scope="col">Código</th>
            <th scope="col">Teléfono</th>
            <th scope="col">Correo</th>
            <th scope="col">Membresía</th>
            <th scope="col">Estado</th>
            <th scope="col">
              <span className="sr-only">Acciones</span>
            </th>
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
                    <div className="member-avatar" aria-hidden="true">
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
                      type="button"
                      className="table-action"
                      onClick={() => onEdit(member)}
                      aria-label={`Editar a ${member.firstName} ${member.lastName}`}
                    >
                      Editar
                    </button>

                    <button
                      type="button"
                      className="table-action"
                      onClick={() => onOpenCrm(member)}
                      aria-label={`Abrir CRM de ${member.firstName} ${member.lastName}`}
                    >
                      CRM
                    </button>

                    {canManage && member.status === 'ACTIVE' && (
                      <button
                        type="button"
                        className="table-action danger"
                        onClick={() => onDeactivate(member)}
                        aria-label={`Desactivar a ${member.firstName} ${member.lastName}`}
                      >
                        Desactivar
                      </button>
                    )}

                    {canManage && member.status === 'INACTIVE' && (
                      <button
                        type="button"
                        className="table-action"
                        onClick={() => onReactivate(member)}
                        aria-label={`Reactivar a ${member.firstName} ${member.lastName}`}
                      >
                        Reactivar
                      </button>
                    )}
                    <button
                      type="button"
                      className="table-action"
                      onClick={() =>
                        setSelectedMemberQr(member)
                      }
                      aria-label={`Ver QR de ${member.firstName} ${member.lastName}`}
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
          memberId={selectedMemberQr.id}
          memberName={`${selectedMemberQr.firstName} ${selectedMemberQr.lastName}`}
          memberCode={selectedMemberQr.memberCode}
          qrToken={selectedMemberQr.qrToken}
          onTokenChange={(qrToken) => {
            setSelectedMemberQr((current) =>
              current
                ? {
                    ...current,
                    qrToken,
                  }
                : current,
            );
          }}
          onClose={() => setSelectedMemberQr(null)}
        />
      )}
    </>
  );
}
