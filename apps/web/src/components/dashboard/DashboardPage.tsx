import { useEffect, useState } from 'react';

import { getDashboard } from '../../services/api';
import type { DashboardSummary } from '../../types/dashboard';
import {
  daysBetweenDateKeys,
  formatDateOnly,
  toDateKey,
  todayDateKey,
} from '../../utils/date';

function formatDate(date: string) {
  return new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date));
}

function formatTime(date: string) {
  return new Intl.DateTimeFormat('es-PE', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

function formatShortDate(dateKey: string) {
  const [year, month, day] = dateKey
    .split('-')
    .map(Number);

  return new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    month: 'short',
  }).format(new Date(year, month - 1, day));
}

function formatSource(source?: string | null) {
  if (!source) {
    return '—';
  }

  if (source === 'MEMBER_CODE') {
    return 'Código';
  }

  return source;
}

function getDaysRemaining(date: string) {
  return daysBetweenDateKeys(
    todayDateKey(),
    toDateKey(date),
  );
}

export function DashboardPage() {
  const [data, setData] =
    useState<DashboardSummary | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError('');

      const result = await getDashboard();

      setData(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudo cargar el dashboard.',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div>
        Cargando dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-message">
        {error}
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const maxDaily = Math.max(
    ...data.attendance.daily.map(
      (day) => day.count,
    ),
    1,
  );

  return (
    <section>
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>

          <p>
            Resumen general del gimnasio.
          </p>
        </div>

        <button
          type="button"
          onClick={loadDashboard}
        >
          Actualizar
        </button>
      </div>

      <div className="dashboard-cards">
        <div className="dashboard-card">
          <span>Miembros</span>
          <strong>
            {data.members.total}
          </strong>

          <small>
            {data.members.active} activos
          </small>
        </div>

        <div className="dashboard-card">
          <span>Membresías activas</span>

          <strong>
            {data.memberships.active}
          </strong>

          <small>
            Vigentes actualmente
          </small>
        </div>

        <div className="dashboard-card">
          <span>Vencen pronto</span>

          <strong>
            {data.memberships.expiringSoon}
          </strong>

          <small>
            Próximos 7 días
          </small>
        </div>

        <div className="dashboard-card">
          <span>Socios vencidos</span>

          <strong>
            {data.memberships.expired}
          </strong>

          <small>
            Sin vigencia actual
          </small>
        </div>
      </div>

      <h2 className="dashboard-section-title">
        Asistencias
      </h2>

      <div className="dashboard-cards">
        <div className="dashboard-card">
          <span>Ingresos hoy</span>

          <strong>
            {data.attendance.today}
          </strong>

          <small>
            {data.attendance.uniqueMembersToday}{' '}
            socios únicos
          </small>
        </div>

        <div className="dashboard-card">
          <span>Últimos 7 días</span>

          <strong>
            {data.attendance.last7Days}
          </strong>

          <small>
            Ingresos registrados
          </small>
        </div>

        <div className="dashboard-card">
          <span>Este mes</span>

          <strong>
            {data.attendance.month}
          </strong>

          <small>
            Mes actual
          </small>
        </div>

        <div className="dashboard-card">
          <span>Socios únicos hoy</span>

          <strong>
            {data.attendance.uniqueMembersToday}
          </strong>

          <small>
            Con al menos un ingreso
          </small>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-panel">
          <div className="panel-header">
            <h2>
              Asistencias últimos 7 días
            </h2>
          </div>

          <div className="attendance-chart">
            {data.attendance.daily.map((day) => (
              <div
                className="attendance-chart-item"
                key={day.date}
              >
                <span className="attendance-chart-value">
                  {day.count}
                </span>

                <div className="attendance-chart-track">
                  <div
                    className="attendance-chart-bar"
                    style={{
                      height: `${
                        (day.count / maxDaily) * 100
                      }%`,
                    }}
                  />
                </div>

                <span className="attendance-chart-label">
                  {formatShortDate(day.date)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="dashboard-panel">
          <div className="panel-header">
            <h2>Últimos ingresos</h2>
          </div>

          {data.attendance.recent.length === 0 ? (
            <div className="empty-state">
              No hay asistencias registradas.
            </div>
          ) : (
            <div className="dashboard-list">
              {data.attendance.recent.map(
                (attendance) => (
                  <div
                    className="dashboard-list-item"
                    key={attendance.id}
                  >
                    <div>
                      <strong>
                        {attendance.member.firstName}{' '}
                        {attendance.member.lastName}
                      </strong>

                      <small>
                        {attendance.member
                          .memberCode ?? '—'}{' '}
                        ·{' '}
                        {formatDate(
                          attendance.checkedInAt,
                        )}{' '}
                        {formatTime(
                          attendance.checkedInAt,
                        )}
                      </small>
                    </div>

                    <span className="attendance-source">
                      {formatSource(
                        attendance.source,
                      )}
                    </span>
                  </div>
                ),
              )}
            </div>
          )}
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-panel">
          <div className="panel-header">
            <h2>
              Membresías por vencer
            </h2>
          </div>

          {data.expiringMemberships.length ===
          0 ? (
            <div className="empty-state">
              No hay membresías próximas a
              vencer.
            </div>
          ) : (
            <div className="dashboard-list">
              {data.expiringMemberships.map(
                (membership) => {
                  const days =
                    getDaysRemaining(
                      membership.endDate,
                    );

                  return (
                    <div
                      className="dashboard-list-item"
                      key={membership.id}
                    >
                      <div>
                        <strong>
                          {
                            membership.member
                              .firstName
                          }{' '}
                          {
                            membership.member
                              .lastName
                          }
                        </strong>

                        <small>
                          {membership.plan.name}
                        </small>
                      </div>

                      <div>
                        <strong>
                          {days}{' '}
                          {days === 1 ? 'día' : 'días'}
                        </strong>

                        <small>
                          Vence{' '}
                          {formatDateOnly(
                            membership.endDate,
                          )}
                        </small>
                      </div>
                    </div>
                  );
                },
              )}
            </div>
          )}
        </div>

        <div className="dashboard-panel">
          <div className="panel-header">
            <h2>
              Últimos miembros
            </h2>
          </div>

          {data.recentMembers.length ===
          0 ? (
            <div className="empty-state">
              No hay miembros registrados.
            </div>
          ) : (
            <div className="dashboard-list">
              {data.recentMembers.map(
                (member) => (
                  <div
                    className="dashboard-list-item"
                    key={member.id}
                  >
                    <div>
                      <strong>
                        {member.firstName}{' '}
                        {member.lastName}
                      </strong>

                      <small>
                        {member.documentNumber ??
                          'Sin documento'}
                      </small>
                    </div>

                    <span
                      className={`status-badge ${
                        member.status === 'ACTIVE'
                          ? 'status-active'
                          : 'status-inactive'
                      }`}
                    >
                      {member.status ===
                      'ACTIVE'
                        ? 'Activo'
                        : 'Inactivo'}
                    </span>
                  </div>
                ),
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
