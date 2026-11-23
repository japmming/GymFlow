import { ArrowRight, CalendarDays, Receipt, Ticket } from 'lucide-react';

import type { GymEvent } from '../../types/event';
import type { Membership } from '../../types/membership';
import type { MyProfile } from '../../types/portal';
import type { Payment } from '../../types/payment';
import type {
  Reservation,
  ReservationPaymentStatus,
  ReservationStatus,
} from '../../types/reservation';
import type { PortalPage } from '../../types/navigation';
import { formatDateOnly, formatDateTime, formatTime } from '../../utils/date';
import { getMembershipState } from '../../utils/membershipStatus';
import { EmptyState } from '../ui/EmptyState';

export interface PortalData {
  profile: MyProfile;
  membership: Membership | null;
  payments: Payment[];
  reservations: Reservation[];
  events: GymEvent[];
}

interface PortalPagesProps {
  data: PortalData;
  currency: string;
  busyId: string | null;
  onNavigate: (page: PortalPage) => void;
  onReserve: (eventId: string) => void;
  onCancel: (reservationId: string) => void;
}

const EVENT_TYPE_LABELS: Record<GymEvent['type'], string> = {
  CLASS: 'Clase',
  WORKSHOP: 'Taller',
  COMPETITION: 'Competencia',
};

const RESERVATION_LABELS: Record<ReservationStatus, string> = {
  PENDING_PAYMENT: 'Pago pendiente',
  CONFIRMED: 'Confirmada',
  CANCELLED: 'Cancelada',
};

const PAYMENT_STATUS_LABELS: Record<ReservationPaymentStatus, string> = {
  NOT_REQUIRED: 'Sin pago',
  PENDING: 'Pendiente',
  PARTIALLY_PAID: 'Pago parcial',
  PAID: 'Pagado',
};

function money(value: number | string, currency: string): string {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency,
  }).format(Number(value));
}

function statusClass(status: ReservationStatus): string {
  if (status === 'CONFIRMED') {
    return 'status-active';
  }

  if (status === 'CANCELLED') {
    return 'status-cancelled';
  }

  return 'status-pending-payment';
}

function MembershipHero({
  membership,
  currency,
}: {
  membership: Membership | null;
  currency: string;
}) {
  const state = getMembershipState(membership);

  if (!membership) {
    return (
      <article className="portal-hero portal-hero--empty">
        <span className="portal-eyebrow">Mi membresía</span>
        <h2>Sin membresía vigente</h2>
        <p>
          Acércate a recepción para conocer los planes
          disponibles y activar tu acceso.
        </p>
      </article>
    );
  }

  const price = Number(membership.price);
  const paid = Number(membership.paidAmount ?? 0);
  const progress =
    price > 0 ? Math.min((paid / price) * 100, 100) : 100;

  return (
    <article className="portal-hero">
      <div className="portal-hero-top">
        <div>
          <span className="portal-eyebrow">Mi membresía</span>
          <h2>{membership.plan.name}</h2>
        </div>

        <span className={`status-badge ${state.className}`}>
          {state.label}
        </span>
      </div>

      <p className="portal-hero-subtitle">
        {formatDateOnly(membership.startDate)} —{' '}
        {formatDateOnly(membership.endDate)}
      </p>

      <div className="portal-balance">
        <div>
          <span className="portal-metric-label">
            Total del plan
          </span>
          <strong>{money(price, currency)}</strong>
        </div>

        <div>
          <span className="portal-metric-label">Pagado</span>
          <strong>{money(paid, currency)}</strong>
        </div>

        <div>
          <span className="portal-metric-label">Saldo</span>
          <strong className="portal-balance-value">
            {money(membership.balance ?? 0, currency)}
          </strong>
        </div>
      </div>

      <div
        className="portal-progress"
        role="progressbar"
        aria-label="Avance de pago de la membresía"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress)}
      >
        <span style={{ width: `${progress}%` }} />
      </div>

      <p className="portal-hero-footnote">
        {state.daysRemaining !== null &&
        state.daysRemaining >= 0
          ? `${state.daysRemaining} ${
              state.daysRemaining === 1
                ? 'día restante'
                : 'días restantes'
            }`
          : 'Revisa tu renovación en recepción'}
      </p>
    </article>
  );
}

export function PortalOverview({
  data,
  currency,
  onNavigate,
}: PortalPagesProps) {
  const activeReservations = data.reservations.filter(
    (item) => item.status !== 'CANCELLED',
  );
  const nextReservations = activeReservations.slice(0, 3);
  const nextEvents = data.events.slice(0, 3);

  return (
    <div className="portal-page-stack">
      <MembershipHero
        membership={data.membership}
        currency={currency}
      />

      <div className="portal-stat-row">
        <button
          type="button"
          className="portal-stat"
          onClick={() => onNavigate('reservations')}
        >
          <Ticket size={18} aria-hidden="true" />
          <span className="portal-stat-value">
            {activeReservations.length}
          </span>
          <span className="portal-stat-label">
            Inscripciones activas
          </span>
        </button>

        <button
          type="button"
          className="portal-stat"
          onClick={() => onNavigate('payments')}
        >
          <Receipt size={18} aria-hidden="true" />
          <span className="portal-stat-value">
            {data.payments.length}
          </span>
          <span className="portal-stat-label">
            Pagos registrados
          </span>
        </button>

        <button
          type="button"
          className="portal-stat"
          onClick={() => onNavigate('events')}
        >
          <CalendarDays size={18} aria-hidden="true" />
          <span className="portal-stat-value">
            {data.events.length}
          </span>
          <span className="portal-stat-label">
            Próximos eventos
          </span>
        </button>
      </div>

      <section className="portal-section">
        <div className="portal-section-head">
          <h3>Próximas inscripciones</h3>
          <button
            type="button"
            className="portal-link"
            onClick={() => onNavigate('reservations')}
          >
            Ver todas <ArrowRight size={14} aria-hidden="true" />
          </button>
        </div>

        {nextReservations.length === 0 ? (
          <EmptyState
            compact
            icon="🎟️"
            title="Aún no tienes inscripciones"
            description="Explora los próximos eventos y reserva tu lugar."
            action={
              <button
                type="button"
                className="button secondary"
                onClick={() => onNavigate('events')}
              >
                Ver eventos
              </button>
            }
          />
        ) : (
          <ul className="portal-mini-list">
            {nextReservations.map((reservation) => (
              <li key={reservation.id}>
                <div>
                  <strong>
                    {reservation.event?.name ?? 'Evento'}
                  </strong>
                  <span>
                    {reservation.event
                      ? formatDateTime(reservation.event.startDate)
                      : formatDateTime(reservation.reservedAt)}
                  </span>
                </div>

                <span
                  className={`status-badge ${statusClass(reservation.status)}`}
                >
                  {RESERVATION_LABELS[reservation.status]}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="portal-section">
        <div className="portal-section-head">
          <h3>Próximos eventos</h3>
          <button
            type="button"
            className="portal-link"
            onClick={() => onNavigate('events')}
          >
            Ver todos <ArrowRight size={14} aria-hidden="true" />
          </button>
        </div>

        {nextEvents.length === 0 ? (
          <EmptyState
            compact
            icon="📅"
            title="No hay eventos programados"
            description="Vuelve pronto para ver nuevas actividades."
          />
        ) : (
          <ul className="portal-mini-list">
            {nextEvents.map((event) => (
              <li key={event.id}>
                <div>
                  <strong>{event.name}</strong>
                  <span>{formatDateTime(event.startDate)}</span>
                </div>
                <span className="portal-event-type">
                  {EVENT_TYPE_LABELS[event.type]}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export function PortalMembership({
  data,
  currency,
}: PortalPagesProps) {
  return (
    <div className="portal-page-stack">
      <MembershipHero
        membership={data.membership}
        currency={currency}
      />

      {data.membership && (
        <section className="portal-section">
          <div className="portal-section-head">
            <h3>Detalle de la membresía</h3>
          </div>

          <dl className="portal-detail-grid">
            <div>
              <dt>Plan</dt>
              <dd>{data.membership.plan.name}</dd>
            </div>
            <div>
              <dt>Duración</dt>
              <dd>{data.membership.plan.durationDays} días</dd>
            </div>
            <div>
              <dt>Inicio</dt>
              <dd>{formatDateOnly(data.membership.startDate)}</dd>
            </div>
            <div>
              <dt>Vencimiento</dt>
              <dd>{formatDateOnly(data.membership.endDate)}</dd>
            </div>
            <div>
              <dt>Precio</dt>
              <dd>{money(data.membership.price, currency)}</dd>
            </div>
            <div>
              <dt>Saldo pendiente</dt>
              <dd>
                {money(data.membership.balance ?? 0, currency)}
              </dd>
            </div>
          </dl>
        </section>
      )}
    </div>
  );
}

export function PortalPayments({
  data,
  currency,
}: PortalPagesProps) {
  if (data.payments.length === 0) {
    return (
      <EmptyState
        icon="🧾"
        title="No hay pagos registrados"
        description="Tus pagos de membresía aparecerán aquí."
      />
    );
  }

  return (
    <div className="table-container">
      <table className="members-table">
        <caption className="sr-only">
          Historial de pagos de membresía
        </caption>
        <thead>
          <tr>
            <th scope="col">Fecha</th>
            <th scope="col">Plan</th>
            <th scope="col">Método</th>
            <th scope="col">Estado</th>
            <th scope="col">Monto</th>
          </tr>
        </thead>
        <tbody>
          {data.payments.map((payment) => (
            <tr key={payment.id}>
              <td>{formatDateTime(payment.paymentDate)}</td>
              <td>{payment.membership.plan.name}</td>
              <td>{payment.method}</td>
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
                    : 'Revertido'}
                </span>
              </td>
              <td className="portal-amount">
                {money(payment.amount, currency)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function PortalEvents({
  data,
  currency,
  busyId,
  onReserve,
}: PortalPagesProps) {
  const reservedIds = new Set(
    data.reservations
      .filter((item) => item.status !== 'CANCELLED')
      .map((item) => item.eventId),
  );

  if (data.events.length === 0) {
    return (
      <EmptyState
        icon="📅"
        title="No hay eventos próximos"
        description="Cuando se publique una nueva actividad, podrás inscribirte desde aquí."
      />
    );
  }

  return (
    <div className="portal-event-grid">
      {data.events.map((event) => {
        const reserved = reservedIds.has(event.id);
        const busy = busyId === event.id;

        return (
          <article className="portal-event-card" key={event.id}>
            <div className="portal-event-head">
              <span className="portal-event-type">
                {EVENT_TYPE_LABELS[event.type]}
              </span>
              <span className="portal-event-date">
                {formatDateOnly(event.startDate)}
              </span>
            </div>

            <h3>{event.name}</h3>

            <p className="portal-event-description">
              {event.description ?? 'Sin descripción.'}
            </p>

            <dl className="portal-event-meta">
              <div>
                <dt>Hora</dt>
                <dd>
                  {formatTime(event.startDate)} —{' '}
                  {formatTime(event.endDate)}
                </dd>
              </div>
              <div>
                <dt>Instructor</dt>
                <dd>
                  {event.instructorName?.trim() || 'Sin instructor'}
                </dd>
              </div>
              <div>
                <dt>Precio</dt>
                <dd>
                  {Number(event.price) === 0
                    ? 'Gratis'
                    : money(event.price, currency)}
                </dd>
              </div>
              <div>
                <dt>Cupos</dt>
                <dd>{event.capacity}</dd>
              </div>
            </dl>

            <button
              type="button"
              className={reserved ? 'button secondary' : 'button primary'}
              disabled={reserved || busy}
              onClick={() => onReserve(event.id)}
            >
              {busy
                ? 'Inscribiendo...'
                : reserved
                  ? 'Ya estás inscrito'
                  : 'Inscribirme'}
            </button>
          </article>
        );
      })}
    </div>
  );
}

export function PortalReservations({
  data,
  currency,
  busyId,
  onCancel,
}: PortalPagesProps) {
  if (data.reservations.length === 0) {
    return (
      <EmptyState
        icon="🎟️"
        title="No tienes inscripciones"
        description="Cuando te inscribas a un evento, verás aquí su estado."
      />
    );
  }

  return (
    <div className="portal-reservation-list">
      {data.reservations.map((reservation) => {
        const busy = busyId === reservation.id;
        const cancelled = reservation.status === 'CANCELLED';

        return (
          <article
            className="portal-reservation"
            key={reservation.id}
          >
            <div className="portal-reservation-main">
              <span className="portal-event-type">
                {reservation.event
                  ? EVENT_TYPE_LABELS[reservation.event.type]
                  : 'Evento'}
              </span>

              <h3>
                {reservation.event?.name ?? 'Evento'}
              </h3>

              <p>
                {reservation.event
                  ? formatDateTime(reservation.event.startDate)
                  : formatDateTime(reservation.reservedAt)}
              </p>
            </div>

            <div className="portal-reservation-side">
              <span
                className={`status-badge ${statusClass(reservation.status)}`}
              >
                {RESERVATION_LABELS[reservation.status]}
              </span>

              <span className="portal-reservation-payment">
                {PAYMENT_STATUS_LABELS[reservation.paymentStatus]}
                {' · '}
                {money(reservation.amount, currency)}
              </span>

              {!cancelled && (
                <button
                  type="button"
                  className="button secondary"
                  disabled={busy}
                  onClick={() => onCancel(reservation.id)}
                >
                  {busy ? 'Cancelando...' : 'Cancelar inscripción'}
                </button>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
