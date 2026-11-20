import {
  ArrowRight,
  CalendarDays,
  Plus,
} from 'lucide-react';

import { useMemo } from 'react';

import type { Page } from '../../types/navigation';
import {
  EVENT_TYPE_LABELS,
  formatEventDate,
  formatEventDayParts,
  formatEventPrice,
  formatEventTimeRange,
} from '../../utils/events';

import { EmptyState } from '../ui/EmptyState';
import { useDashboardData } from './DashboardDataProvider';

export function UpcomingClasses({
  onNavigate,
}: {
  onNavigate: (page: Page) => void;
}) {
  const { data } = useDashboardData();

  const upcomingEvents = useMemo(() => {
    const now = Date.now();

    return (data?.events ?? [])
      .filter(
        (event) =>
          event.status === 'PUBLISHED' &&
          new Date(event.endDate).getTime() >= now,
      )
      .sort(
        (first, second) =>
          new Date(first.startDate).getTime() -
          new Date(second.startDate).getTime(),
      )
      .slice(0, 3);
  }, [data?.events]);

  return (
    <section className="dashboard-card">
      <div className="card-head">
        <div>
          <h2>Próximos eventos</h2>
          <p>Clases, talleres y competencias</p>
        </div>

        <button
          type="button"
          className="card-link"
          onClick={() => onNavigate('events')}
        >
          Ver agenda
          <ArrowRight size={14} aria-hidden="true" />
        </button>
      </div>

      {upcomingEvents.length === 0 ? (
        <EmptyState
          compact
          icon="📅"
          title="Sin eventos programados"
          description="Publica un evento para que aparezca en la agenda del gimnasio."
          action={
            <button
              type="button"
              className="button secondary"
              onClick={() => onNavigate('events')}
            >
              <Plus size={15} aria-hidden="true" />
              Crear evento
            </button>
          }
        />
      ) : (
        <div className="upcoming-events">
          {upcomingEvents.map((event) => {
            const day = formatEventDayParts(event.startDate);

            return (
              <button
                type="button"
                className="upcoming-event"
                key={event.id}
                onClick={() => onNavigate('events')}
              >
                <span className="sr-only">
                  {formatEventDate(event.startDate)}.{' '}
                </span>

                <span
                  className="upcoming-event-date"
                  aria-hidden="true"
                >
                  <strong>{day.day}</strong>
                  <span>{day.month}</span>
                </span>

                <span className="upcoming-event-body">
                  <span>
                    {EVENT_TYPE_LABELS[event.type]} ·{' '}
                    {formatEventTimeRange(
                      event.startDate,
                      event.endDate,
                    )}
                  </span>

                  <strong>{event.name}</strong>

                  <small>
                    {event.capacity} cupos ·{' '}
                    {formatEventPrice(event.price)}
                  </small>
                </span>

                <ArrowRight
                  size={14}
                  className="upcoming-event-arrow"
                  aria-hidden="true"
                />
              </button>
            );
          })}
        </div>
      )}

      {upcomingEvents.length > 0 && (
        <div className="upcoming-events-foot">
          <CalendarDays size={13} aria-hidden="true" />
          Agenda completa en el módulo de eventos
        </div>
      )}
    </section>
  );
}
