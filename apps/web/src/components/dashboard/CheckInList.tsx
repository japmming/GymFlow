import { ArrowRight } from 'lucide-react';
import type { CSSProperties } from 'react';

import type { Attendance } from '../../types/attendance';
import {
  formatDateOnly,
  formatTime,
  todayDateKey,
} from '../../utils/date';
import { EmptyState } from '../ui/EmptyState';

function getInitials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

function getAvatarStyle(name: string): CSSProperties {
  let hash = 0;

  for (const character of name) {
    hash = (hash * 31 + character.charCodeAt(0)) % 360;
  }

  return {
    '--avatar-hue': String(hash),
  } as CSSProperties;
}

function getAccessState(attendance: Attendance) {
  if (!attendance.membership) {
    return {
      label: 'Sin membresía',
      className: 'status-none',
    };
  }

  const isActive =
    attendance.membership.status === 'ACTIVE' &&
    attendance.membership.endDate >= todayDateKey();

  return isActive
    ? { label: 'Activa', className: 'status-active' }
    : { label: 'Vencida', className: 'status-expired' };
}

function formatSource(source?: string | null) {
  if (!source) {
    return 'Manual';
  }

  if (source === 'MEMBER_CODE') {
    return 'Código';
  }

  if (source === 'QR') {
    return 'QR';
  }

  return source;
}

export function CheckInList({
  attendances,
  onViewAll,
}: {
  attendances: Attendance[];
  onViewAll: () => void;
}) {
  const today = todayDateKey();

  return (
    <section className="dashboard-card">
      <div className="card-head">
        <div>
          <h2>Últimos check-ins</h2>
          <p>Accesos recientes al gimnasio</p>
        </div>

        <button
          type="button"
          className="card-link"
          onClick={onViewAll}
        >
          Ver todo
          <ArrowRight size={14} aria-hidden="true" />
        </button>
      </div>

      {attendances.length === 0 ? (
        <EmptyState
          compact
          icon="🕒"
          title="Sin accesos recientes"
          description="Los ingresos que registres aparecerán aquí."
        />
      ) : (
        <div className="compact-table-wrap">
          <table className="compact-table">
            <caption className="sr-only">
              Últimos check-ins registrados
            </caption>

            <thead>
              <tr>
                <th scope="col">Socio</th>
                <th scope="col">Hora</th>
                <th scope="col">Membresía</th>
              </tr>
            </thead>

            <tbody>
              {attendances.slice(0, 6).map((attendance) => {
                const accessState =
                  getAccessState(attendance);
                const attendanceDay =
                  attendance.attendanceDate.slice(0, 10);

                return (
                  <tr key={attendance.id}>
                    <td>
                      <div className="checkin-member">
                        <span
                          className="checkin-avatar"
                          style={getAvatarStyle(
                            `${attendance.member.firstName} ${attendance.member.lastName}`,
                          )}
                          aria-hidden="true"
                        >
                          {getInitials(
                            attendance.member.firstName,
                            attendance.member.lastName,
                          )}
                        </span>

                        <span className="checkin-member-text">
                          <strong>
                            {attendance.member.firstName}{' '}
                            {attendance.member.lastName}
                          </strong>
                          <small>
                            {attendance.member.memberCode ??
                              '—'}{' '}
                            ·{' '}
                            {formatSource(
                              attendance.source,
                            )}
                          </small>
                        </span>
                      </div>
                    </td>

                    <td>
                      <span className="checkin-time">
                        {formatTime(
                          attendance.checkedInAt,
                        )}
                      </span>

                      {attendanceDay !== today && (
                        <small className="checkin-date">
                          {formatDateOnly(attendanceDay)}
                        </small>
                      )}
                    </td>

                    <td>
                      <span
                        className={`status-badge ${accessState.className}`}
                      >
                        {accessState.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
