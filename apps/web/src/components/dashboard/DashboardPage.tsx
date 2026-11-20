import {
  CalendarClock,
  RefreshCw,
  ScanLine,
  Users,
  Wallet,
} from 'lucide-react';

import { useAuth } from '../../auth/AuthProvider';
import type { Page } from '../../types/navigation';
import {
  toLocalDateKey,
  todayDateKey,
} from '../../utils/date';
import { EmptyState } from '../ui/EmptyState';
import { CheckInList } from './CheckInList';
import { useDashboardData } from './DashboardDataProvider';
import { DashboardSkeleton } from './DashboardSkeleton';
import { KpiCard } from './KpiCard';
import { MembershipDonut } from './MembershipDonut';
import { RevenueChart } from './RevenueChart';
import { UpcomingClasses } from './UpcomingClasses';

const CURRENCY_FORMATTER = new Intl.NumberFormat('es-PE', {
  style: 'currency',
  currency: 'PEN',
  maximumFractionDigits: 0,
});

const DATE_FORMATTER = new Intl.DateTimeFormat('es-PE', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});

/**
 * Capacidad operativa referencial para mostrar el aforo del día.
 * Se reemplazará cuando el API exponga la configuración del gimnasio.
 */
const DAILY_CAPACITY = 40;

function formatMoney(value: number) {
  return CURRENCY_FORMATTER.format(value);
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function getMonthKey(value: string) {
  return toLocalDateKey(value).slice(0, 7);
}

function getPreviousMonthKey() {
  const now = new Date();
  const previous = new Date(
    now.getFullYear(),
    now.getMonth() - 1,
    1,
  );

  return `${previous.getFullYear()}-${String(
    previous.getMonth() + 1,
  ).padStart(2, '0')}`;
}

function getDelta(current: number, previous: number) {
  if (previous <= 0) {
    return null;
  }

  return ((current - previous) / previous) * 100;
}

function getGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) {
    return 'Buenos días';
  }

  if (hour < 19) {
    return 'Buenas tardes';
  }

  return 'Buenas noches';
}

interface DashboardPageProps {
  onNavigate: (page: Page) => void;
  onCreateMember: () => void;
}

export function DashboardPage({
  onNavigate,
  onCreateMember,
}: DashboardPageProps) {
  const { user } = useAuth();
  const { data, loading, refreshing, error, refresh } =
    useDashboardData();

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error && !data) {
    return (
      <section className="dashboard-page" role="alert">
        <EmptyState
          icon="⚠"
          title="No pudimos cargar el panel"
          description={error}
          action={
            <button
              type="button"
              className="button primary"
              onClick={() => {
                void refresh('initial');
              }}
            >
              Reintentar
            </button>
          }
        />
      </section>
    );
  }

  if (!data) {
    return null;
  }

  const { summary, payments, memberships } = data;

  const today = todayDateKey();
  const currentMonthKey = today.slice(0, 7);
  const previousMonthKey = getPreviousMonthKey();

  const completedPayments = payments.filter(
    (payment) => payment.status === 'COMPLETED',
  );

  const monthPayments = completedPayments.filter(
    (payment) =>
      getMonthKey(payment.paymentDate) === currentMonthKey,
  );

  const monthRevenue = monthPayments.reduce(
    (total, payment) =>
      total + Number(payment.amount ?? 0),
    0,
  );

  const previousRevenue = completedPayments
    .filter(
      (payment) =>
        getMonthKey(payment.paymentDate) ===
        previousMonthKey,
    )
    .reduce(
      (total, payment) =>
        total + Number(payment.amount ?? 0),
      0,
    );

  const newMembersThisMonth = data.members.filter(
    (member) =>
      getMonthKey(member.createdAt) === currentMonthKey,
  ).length;

  const newMembersPreviousMonth = data.members.filter(
    (member) =>
      getMonthKey(member.createdAt) === previousMonthKey,
  ).length;

  const attendanceRate = Math.min(
    Math.round(
      (summary.attendance.today / DAILY_CAPACITY) * 100,
    ),
    100,
  );

  const firstName = user?.firstName ?? 'equipo';

  return (
    <section className="dashboard-page">
      <div className="dashboard-heading">
        <div>
          <span className="page-eyebrow">
            Resumen general
          </span>

          <h1>
            {getGreeting()}, {firstName}
          </h1>

          <p>
            {capitalize(DATE_FORMATTER.format(new Date()))}
            {' · '}
            Así va el gimnasio hoy.
          </p>
        </div>

        <div className="dashboard-heading-actions">
          <button
            type="button"
            className="button secondary"
            onClick={() => {
              void refresh();
            }}
            disabled={refreshing}
          >
            <RefreshCw
              size={16}
              className={refreshing ? 'is-spinning' : undefined}
              aria-hidden="true"
            />
            {refreshing ? 'Actualizando...' : 'Actualizar'}
          </button>

          <button
            type="button"
            className="button primary"
            onClick={onCreateMember}
          >
            <Users size={16} aria-hidden="true" />
            Nuevo socio
          </button>
        </div>
      </div>

      {error && (
        <div className="alert error" role="alert">
          {error}
        </div>
      )}

      <div className="kpi-grid">
        <KpiCard
          label="Socios activos"
          value={summary.members.active}
          icon={Users}
          tone="brand"
          delta={getDelta(
            newMembersThisMonth,
            newMembersPreviousMonth,
          )}
          deltaLabel="nuevos vs. mes anterior"
          footer={
            <>
              <span>
                {summary.members.total} socios en total
              </span>
              <span>{summary.members.inactive} inactivos</span>
            </>
          }
        />

        <KpiCard
          label="Ingresos del mes"
          value={formatMoney(monthRevenue)}
          icon={Wallet}
          tone="success"
          delta={getDelta(monthRevenue, previousRevenue)}
          deltaLabel="vs. mes anterior"
          footer={
            <>
              <span>
                {monthPayments.length}{' '}
                {monthPayments.length === 1
                  ? 'pago registrado'
                  : 'pagos registrados'}
              </span>
              <span>
                {formatMoney(previousRevenue)} el mes pasado
              </span>
            </>
          }
        />

        <KpiCard
          label="Asistencias de hoy"
          value={summary.attendance.today}
          icon={ScanLine}
          tone="info"
          deltaLabel={`${summary.attendance.uniqueMembersToday} socios únicos`}
          footer={
            <div className="kpi-progress">
              <div
                className="kpi-progress-track"
                role="img"
                aria-label={`Aforo de hoy: ${summary.attendance.today} de ${DAILY_CAPACITY} cupos`}
              >
                <div
                  className="kpi-progress-fill"
                  style={{ width: `${attendanceRate}%` }}
                />
              </div>

              <span>
                {summary.attendance.today}/{DAILY_CAPACITY}{' '}
                cupos
              </span>
            </div>
          }
        />

        <KpiCard
          label="Membresías por vencer"
          value={summary.memberships.expiringSoon}
          icon={CalendarClock}
          tone="warning"
          deltaLabel="próximos 7 días"
          footer={
            <button
              type="button"
              className="kpi-link"
              onClick={() => onNavigate('memberships')}
            >
              Gestionar membresías
              <span aria-hidden="true">→</span>
            </button>
          }
        />
      </div>

      <div className="dashboard-analytics">
        <RevenueChart payments={payments} />

        <MembershipDonut memberships={memberships} />
      </div>

      <div className="dashboard-operations">
        <CheckInList
          attendances={summary.attendance.recent}
          onViewAll={() => onNavigate('attendance')}
        />

        <UpcomingClasses onNavigate={onNavigate} />
      </div>
    </section>
  );
}
