import {
  BadgeCheck,
  Ban,
  CalendarRange,
  ClipboardList,
  Clock,
  Pencil,
  Send,
  UserPlus,
  Users,
  Wallet,
} from 'lucide-react';

import type { GymEvent } from '../../types/event';

import { toLocalDateKey } from '../../utils/date';
import {
  EVENT_STATUS_LABELS,
  EVENT_TYPE_LABELS,
  canCancelEvent,
  canPublishEvent,
  eventStatusClass,
  eventTypeClass,
  formatEventDayParts,
  formatEventDuration,
  formatEventDate,
  formatEventPrice,
  formatEventTimeRange,
  isEventEditable,
  isEventPast,
} from '../../utils/events';

interface EventCardProps {
  event: GymEvent;
  isAdmin: boolean;
  reservedCount?: number;
  onEdit: (event: GymEvent) => void;
  onPublish: (event: GymEvent) => void;
  onCancel: (event: GymEvent) => void;
  onReserve: (event: GymEvent) => void;
  onViewReservations: (event: GymEvent) => void;
}

export function EventCard({
  event,
  isAdmin,
  reservedCount = 0,
  onEdit,
  onPublish,
  onCancel,
  onReserve,
  onViewReservations,
}: EventCardProps) {
  const day = formatEventDayParts(event.startDate);
  const past = isEventPast(event);

  const editable = isEventEditable(event);
  const publishable = isAdmin && canPublishEvent(event);
  const cancellable = isAdmin && canCancelEvent(event);
  const reservable =
    event.status === 'PUBLISHED' &&
    !past &&
    reservedCount < event.capacity;
  const hasReservationsAction = !past;
  const hasActions =
    editable ||
    publishable ||
    cancellable ||
    reservable ||
    hasReservationsAction;

  const multiDay =
    toLocalDateKey(event.startDate) !==
    toLocalDateKey(event.endDate);

  return (
    <article
      className={[
        'event-card',
        `event-card--${event.type.toLowerCase()}`,
        `event-card--${event.status.toLowerCase()}`,
        past ? 'event-card--past' : '',
        hasActions ? '' : 'event-card--no-actions',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="event-date" aria-hidden="true">
        <span className="event-date-weekday">
          {day.weekday}
        </span>
        <strong>{day.day}</strong>
        <span className="event-date-month">{day.month}</span>
      </div>

      <div className="event-card-body">
        <span className="sr-only">
          {formatEventDate(event.startDate)}.{' '}
        </span>

        <div className="event-card-top">
          <span
            className={`event-type ${eventTypeClass(event.type)}`}
          >
            {EVENT_TYPE_LABELS[event.type]}
          </span>

          <span
            className={`status-badge ${eventStatusClass(event.status)}`}
          >
            {EVENT_STATUS_LABELS[event.status]}
          </span>
        </div>

        <h3>{event.name}</h3>

        {event.description && (
          <p className="event-card-description">
            {event.description}
          </p>
        )}

        <div className="event-meta">
          <span>
            <Clock size={13} aria-hidden="true" />
            {formatEventTimeRange(
              event.startDate,
              event.endDate,
            )}
          </span>

          <span>
            <CalendarRange size={13} aria-hidden="true" />
            {formatEventDuration(
              event.startDate,
              event.endDate,
            )}
          </span>

          <span>
            <Users size={13} aria-hidden="true" />
            {reservedCount}/{event.capacity}{' '}
            {event.capacity === 1 ? 'cupo' : 'cupos'}
          </span>

          <span
            className={
              Number(event.price) > 0
                ? 'event-meta-emphasis'
                : undefined
            }
          >
            <Wallet size={13} aria-hidden="true" />
            {formatEventPrice(event.price)}
          </span>

          {event.requiresActiveMembership && (
            <span>
              <BadgeCheck size={13} aria-hidden="true" />
              Solo socios
            </span>
          )}
        </div>

        {multiDay && (
          <p className="event-card-note">
            Finaliza el {formatEventDate(event.endDate)}
          </p>
        )}
      </div>

      {hasActions && (
        <div className="event-card-actions">
          {reservable && (
            <button
              type="button"
              className="table-action event-action-reserve"
              onClick={() => onReserve(event)}
            >
              <UserPlus size={14} aria-hidden="true" />
              Inscribir socio
            </button>
          )}

          {hasReservationsAction && (
            <button
              type="button"
              className="table-action"
              onClick={() => onViewReservations(event)}
            >
              <ClipboardList size={14} aria-hidden="true" />
              Reservas
            </button>
          )}

          {editable && (
            <button
              type="button"
              className="table-action"
              onClick={() => onEdit(event)}
            >
              <Pencil size={14} aria-hidden="true" />
              Editar
            </button>
          )}

          {publishable && (
            <button
              type="button"
              className="table-action event-action-publish"
              onClick={() => onPublish(event)}
            >
              <Send size={14} aria-hidden="true" />
              Publicar
            </button>
          )}

          {cancellable && (
            <button
              type="button"
              className="table-action danger"
              onClick={() => onCancel(event)}
            >
              <Ban size={14} aria-hidden="true" />
              Cancelar
            </button>
          )}
        </div>
      )}
    </article>
  );
}
