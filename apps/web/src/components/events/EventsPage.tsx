import {
  CalendarDays,
  Clock,
  Plus,
  RefreshCw,
  Sparkles,
  Users,
  Wallet,
} from 'lucide-react';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { useAuth } from '../../auth/AuthProvider';

import {
  cancelEvent,
  cancelReservation,
  createEvent,
  createReservation,
  getEvents,
  getReservations,
  publishEvent,
  registerEventPayment,
  updateEvent,
} from '../../services/api';

import type {
  CreateEventRequest,
  EventStatus,
  EventType,
  GymEvent,
} from '../../types/event';
import type {
  CreateEventPaymentRequest,
  Reservation,
} from '../../types/reservation';

import {
  formatCurrency,
  formatMemberName,
} from '../../utils/reservations';
import { matchesSearch } from '../../utils/search';
import {
  EVENT_STATUS_LABELS,
  EVENT_STATUS_OPTIONS,
  EVENT_TYPE_FILTER_LABELS,
  EVENT_TYPE_LABELS,
  EVENT_TYPE_OPTIONS,
  eventMonthKey,
  eventTypeClass,
  formatEventDate,
  formatEventDayParts,
  formatEventMonth,
  formatEventPrice,
  formatEventTimeRange,
} from '../../utils/events';

import { EventReservationsModal } from '../reservations/EventReservationsModal';
import { ReservationForm } from '../reservations/ReservationForm';
import { ActionDialog } from '../ui/ActionDialog';
import { EmptyState } from '../ui/EmptyState';
import { LoadingState } from '../ui/LoadingState';
import { Modal } from '../ui/Modal';
import { SearchField } from '../ui/SearchField';
import { useToast } from '../ui/ToastProvider';

import { EventCard } from './EventCard';
import { EventForm } from './EventForm';

type EventScope = 'upcoming' | 'past' | 'all';

function FilterGroup({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="event-filter-group">
      <span className="event-filter-label">{label}</span>

      <div
        className="filter-presets"
        role="group"
        aria-label={`Filtrar por ${label.toLowerCase()}`}
      >
        {children}
      </div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className="filter-chip"
      aria-pressed={active}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export function EventsPage() {
  const { isAdmin } = useAuth();
  const { notify } = useToast();

  const [events, setEvents] = useState<GymEvent[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<
    EventType | 'ALL'
  >('ALL');
  const [statusFilter, setStatusFilter] = useState<
    EventStatus | 'ALL'
  >('ALL');
  const [scope, setScope] = useState<EventScope>('upcoming');

  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] =
    useState<GymEvent | null>(null);
  const [pendingPublish, setPendingPublish] =
    useState<GymEvent | null>(null);
  const [pendingCancel, setPendingCancel] =
    useState<GymEvent | null>(null);
  const [reservingEvent, setReservingEvent] =
    useState<GymEvent | null>(null);
  const [reservationsEvent, setReservationsEvent] =
    useState<GymEvent | null>(null);
  const [pendingCancelReservation, setPendingCancelReservation] =
    useState<Reservation | null>(null);

  const loadReservations = useCallback(async () => {
    try {
      const data = await getReservations();

      setReservations(data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const loadEvents = useCallback(
    async (mode: 'initial' | 'refresh' = 'initial') => {
      try {
        if (mode === 'initial') {
          setLoading(true);
        } else {
          setRefreshing(true);
        }

        setError('');

        const [data] = await Promise.all([
          getEvents(),
          loadReservations(),
        ]);

        setEvents(data);
      } catch (err) {
        console.error(err);

        setError(
          'No se pudieron cargar los eventos. Revisa tu conexión e inténtalo de nuevo.',
        );
      } finally {
        if (mode === 'initial') {
          setLoading(false);
        } else {
          setRefreshing(false);
        }
      }
    },
    [loadReservations],
  );

  useEffect(() => {
    void loadEvents('initial');
  }, [loadEvents]);

  const stats = useMemo(() => {
    const now = Date.now();

    return {
      upcoming: events.filter(
        (event) =>
          event.status !== 'CANCELLED' &&
          new Date(event.endDate).getTime() >= now,
      ).length,
      published: events.filter(
        (event) => event.status === 'PUBLISHED',
      ).length,
      draft: events.filter(
        (event) => event.status === 'DRAFT',
      ).length,
      cancelled: events.filter(
        (event) => event.status === 'CANCELLED',
      ).length,
    };
  }, [events]);

  const nextEvent = useMemo(() => {
    const now = Date.now();

    return (
      events
        .filter(
          (event) =>
            event.status === 'PUBLISHED' &&
            new Date(event.endDate).getTime() >= now,
        )
        .sort(
          (first, second) =>
            new Date(first.startDate).getTime() -
            new Date(second.startDate).getTime(),
        )[0] ?? null
    );
  }, [events]);

  const filteredEvents = useMemo(() => {
    const now = Date.now();

    return events
      .filter((event) => {
        if (
          typeFilter !== 'ALL' &&
          event.type !== typeFilter
        ) {
          return false;
        }

        if (
          statusFilter !== 'ALL' &&
          event.status !== statusFilter
        ) {
          return false;
        }

        const past =
          new Date(event.endDate).getTime() < now;

        if (scope === 'upcoming' && past) {
          return false;
        }

        if (scope === 'past' && !past) {
          return false;
        }

        if (
          scope === 'upcoming' &&
          statusFilter === 'ALL' &&
          event.status === 'CANCELLED'
        ) {
          return false;
        }

        return matchesSearch(
          [
            event.name,
            event.description,
            EVENT_TYPE_LABELS[event.type],
            EVENT_STATUS_LABELS[event.status],
          ],
          search,
        );
      })
      .sort((first, second) => {
        const difference =
          new Date(first.startDate).getTime() -
          new Date(second.startDate).getTime();

        return scope === 'past' ? -difference : difference;
      });
  }, [events, scope, search, statusFilter, typeFilter]);

  const monthGroups = useMemo(() => {
    const groups: Array<{
      key: string;
      label: string;
      events: GymEvent[];
    }> = [];

    for (const event of filteredEvents) {
      const key = eventMonthKey(event.startDate);
      const lastGroup = groups[groups.length - 1];

      if (lastGroup && lastGroup.key === key) {
        lastGroup.events.push(event);
        continue;
      }

      groups.push({
        key,
        label: formatEventMonth(event.startDate),
        events: [event],
      });
    }

    return groups;
  }, [filteredEvents]);

  const reservedCountByEvent = useMemo(() => {
    const counts = new Map<string, number>();

    for (const reservation of reservations) {
      if (reservation.status === 'CANCELLED') {
        continue;
      }

      counts.set(
        reservation.eventId,
        (counts.get(reservation.eventId) ?? 0) + 1,
      );
    }

    return counts;
  }, [reservations]);

  const eventReservations = useMemo(() => {
    if (!reservationsEvent) {
      return [];
    }

    return reservations.filter(
      (reservation) =>
        reservation.eventId === reservationsEvent.id,
    );
  }, [reservations, reservationsEvent]);

  const closeForm = () => {
    setShowForm(false);
    setEditingEvent(null);
  };

  const openCreateForm = () => {
    setEditingEvent(null);
    setShowForm(true);
  };

  const openEditForm = (event: GymEvent) => {
    setEditingEvent(event);
    setShowForm(false);
  };

  const clearFilters = () => {
    setSearch('');
    setTypeFilter('ALL');
    setStatusFilter('ALL');
    setScope('all');
  };

  const handleCreate = async (data: CreateEventRequest) => {
    await createEvent(data);

    closeForm();
    await loadEvents('refresh');

    notify('Evento creado correctamente.');
  };

  const handleUpdate = async (data: CreateEventRequest) => {
    if (!editingEvent) {
      return;
    }

    await updateEvent(editingEvent.id, data);

    closeForm();
    await loadEvents('refresh');

    notify('Evento actualizado correctamente.');
  };

  const handlePublish = async (event: GymEvent) => {
    await publishEvent(event.id);

    await loadEvents('refresh');

    notify(`"${event.name}" se publicó correctamente.`);
  };

  const handleCancel = async (event: GymEvent) => {
    await cancelEvent(event.id);

    await loadEvents('refresh');

    notify(`"${event.name}" fue cancelado.`);
  };

  const handleCreateReservation = async (memberId: string) => {
    if (!reservingEvent) {
      return;
    }

    const reservation = await createReservation({
      eventId: reservingEvent.id,
      memberId,
    });

    setReservingEvent(null);
    await loadEvents('refresh');

    notify(
      reservation.paymentStatus === 'NOT_REQUIRED'
        ? 'Inscripción confirmada correctamente.'
        : 'Inscripción registrada. Falta registrar el pago para confirmarla.',
    );
  };

  const handleRegisterPayment = async (
    id: string,
    data: CreateEventPaymentRequest,
  ) => {
    const result = await registerEventPayment(id, data);

    await loadEvents('refresh');

    notify(
      Number(result.balance) === 0
        ? 'Pago registrado. La inscripción quedó confirmada.'
        : `Pago parcial registrado. Saldo pendiente: ${formatCurrency(result.balance)}.`,
    );
  };

  const handleCancelReservation = async () => {
    if (!pendingCancelReservation) {
      return;
    }

    await cancelReservation(pendingCancelReservation.id);

    setPendingCancelReservation(null);
    await loadEvents('refresh');

    notify(
      `La inscripción de ${formatMemberName(
        pendingCancelReservation.member,
      )} fue cancelada.`,
    );
  };

  if (loading) {
    return (
      <div className="page-container">
        <LoadingState label="Cargando eventos..." />
      </div>
    );
  }

  const featureDay = nextEvent
    ? formatEventDayParts(nextEvent.startDate)
    : null;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <span className="page-eyebrow">Operación</span>
          <h1>Eventos</h1>
          <p>
            Organiza clases, talleres y competencias, controla
            los cupos y publica la agenda del gimnasio.
          </p>
        </div>

        <div className="page-header-actions">
          <button
            type="button"
            className="button secondary"
            onClick={() => {
              void loadEvents('refresh');
            }}
            disabled={refreshing}
          >
            <RefreshCw
              size={15}
              className={refreshing ? 'is-spinning' : undefined}
              aria-hidden="true"
            />
            {refreshing ? 'Actualizando...' : 'Actualizar'}
          </button>

          <button
            type="button"
            className="button primary"
            onClick={openCreateForm}
          >
            <Plus size={16} aria-hidden="true" />
            Nuevo evento
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message" role="alert">
          {error}
        </div>
      )}

      <div className="event-stats">
        <div className="event-stat event-stat--upcoming">
          <span>Próximos</span>
          <strong>{stats.upcoming}</strong>
          <small>por realizarse</small>
        </div>

        <div className="event-stat event-stat--published">
          <span>Publicados</span>
          <strong>{stats.published}</strong>
          <small>en total</small>
        </div>

        <div className="event-stat event-stat--draft">
          <span>Borradores</span>
          <strong>{stats.draft}</strong>
          <small>pendientes de publicar</small>
        </div>

        <div className="event-stat event-stat--cancelled">
          <span>Cancelados</span>
          <strong>{stats.cancelled}</strong>
          <small>fuera de la agenda</small>
        </div>
      </div>

      {nextEvent && featureDay && (
        <section
          className="event-feature"
          aria-label="Próximo evento"
        >
          <div className="event-date" aria-hidden="true">
            <span className="event-date-weekday">
              {featureDay.weekday}
            </span>
            <strong>{featureDay.day}</strong>
            <span className="event-date-month">
              {featureDay.month}
            </span>
          </div>

          <div className="event-feature-body">
            <div className="event-feature-top">
              <span className="event-feature-eyebrow">
                <Sparkles size={12} aria-hidden="true" />
                Próximo evento
              </span>

              <span
                className={`event-type ${eventTypeClass(
                  nextEvent.type,
                )}`}
              >
                {EVENT_TYPE_LABELS[nextEvent.type]}
              </span>
            </div>

            <h2>{nextEvent.name}</h2>

            <p>
              {nextEvent.description ||
                'Consulta los detalles y reserva tu cupo en la agenda del gimnasio.'}
            </p>

            <div className="event-meta">
              <span>
                <CalendarDays size={13} aria-hidden="true" />
                {formatEventDate(nextEvent.startDate)}
              </span>

              <span>
                <Clock size={13} aria-hidden="true" />
                {formatEventTimeRange(
                  nextEvent.startDate,
                  nextEvent.endDate,
                )}
              </span>

              <span>
                <Users size={13} aria-hidden="true" />
                {nextEvent.capacity} cupos
              </span>

              <span>
                <Wallet size={13} aria-hidden="true" />
                {formatEventPrice(nextEvent.price)}
              </span>
            </div>
          </div>
        </section>
      )}

      <div className="event-filterbar">
        <div className="members-toolbar">
          <SearchField
            label="Buscar eventos"
            placeholder="Buscar por nombre, descripción o tipo..."
            value={search}
            onChange={setSearch}
          />

          <div className="members-count" aria-live="polite">
            {filteredEvents.length} de {events.length}{' '}
            {events.length === 1 ? 'evento' : 'eventos'}
          </div>
        </div>

        <div className="event-filter-groups">
          <FilterGroup label="Tipo">
            <FilterChip
              active={typeFilter === 'ALL'}
              onClick={() => setTypeFilter('ALL')}
            >
              Todos
            </FilterChip>

            {EVENT_TYPE_OPTIONS.map((option) => (
              <FilterChip
                key={option.value}
                active={typeFilter === option.value}
                onClick={() => setTypeFilter(option.value)}
              >
                {EVENT_TYPE_FILTER_LABELS[option.value]}
              </FilterChip>
            ))}
          </FilterGroup>

          <FilterGroup label="Estado">
            <FilterChip
              active={statusFilter === 'ALL'}
              onClick={() => setStatusFilter('ALL')}
            >
              Todos
            </FilterChip>

            {EVENT_STATUS_OPTIONS.map((option) => (
              <FilterChip
                key={option.value}
                active={statusFilter === option.value}
                onClick={() =>
                  setStatusFilter(option.value)
                }
              >
                {option.label}
              </FilterChip>
            ))}
          </FilterGroup>

          <FilterGroup label="Periodo">
            <FilterChip
              active={scope === 'upcoming'}
              onClick={() => setScope('upcoming')}
            >
              Próximos
            </FilterChip>

            <FilterChip
              active={scope === 'past'}
              onClick={() => setScope('past')}
            >
              Pasados
            </FilterChip>

            <FilterChip
              active={scope === 'all'}
              onClick={() => setScope('all')}
            >
              Todos
            </FilterChip>
          </FilterGroup>
        </div>
      </div>

      {monthGroups.length === 0 ? (
        events.length === 0 ? (
          <EmptyState
            icon="📅"
            title="Todavía no hay eventos"
            description="Crea la primera clase, taller o competencia para empezar a llenar la agenda."
            action={
              <button
                type="button"
                className="button primary"
                onClick={openCreateForm}
              >
                <Plus size={16} aria-hidden="true" />
                Crear evento
              </button>
            }
          />
        ) : (
          <EmptyState
            compact
            icon="🔎"
            title="No encontramos eventos"
            description="Prueba con otro tipo, estado o periodo."
            action={
              <button
                type="button"
                className="button secondary"
                onClick={clearFilters}
              >
                Ver todos los eventos
              </button>
            }
          />
        )
      ) : (
        <div className="event-agenda">
          {monthGroups.map((group) => (
            <section
              className="event-month"
              key={group.key}
              aria-labelledby={`event-month-${group.key}`}
            >
              <div className="event-month-head">
                <h2 id={`event-month-${group.key}`}>
                  {group.label}
                </h2>

                <span className="event-month-count">
                  {group.events.length}{' '}
                  {group.events.length === 1
                    ? 'evento'
                    : 'eventos'}
                </span>
              </div>

              <div className="event-list">
                {group.events.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    isAdmin={isAdmin}
                    reservedCount={
                      reservedCountByEvent.get(event.id) ?? 0
                    }
                    onEdit={openEditForm}
                    onPublish={setPendingPublish}
                    onCancel={setPendingCancel}
                    onReserve={setReservingEvent}
                    onViewReservations={setReservationsEvent}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {(showForm || editingEvent) && (
        <Modal
          title={
            editingEvent ? 'Editar evento' : 'Nuevo evento'
          }
          description={
            editingEvent
              ? 'Actualiza los datos del evento. Los cambios se verán en la agenda.'
              : 'Define los datos del evento. Se creará como borrador para que puedas revisarlo antes de publicarlo.'
          }
          onClose={closeForm}
        >
          <EventForm
            event={editingEvent}
            onSubmit={
              editingEvent ? handleUpdate : handleCreate
            }
            onCancel={closeForm}
          />
        </Modal>
      )}

      {pendingPublish && (
        <ActionDialog
          title="Publicar evento"
          description={
            <>
              Se publicará{' '}
              <strong>{pendingPublish.name}</strong> en la
              agenda del gimnasio. Podrás editarlo o
              cancelarlo más adelante.
            </>
          }
          confirmLabel="Publicar evento"
          cancelLabel="Volver"
          onConfirm={() => handlePublish(pendingPublish)}
          onClose={() => setPendingPublish(null)}
        />
      )}

      {pendingCancel && (
        <ActionDialog
          title="Cancelar evento"
          description={
            <>
              Se cancelará{' '}
              <strong>{pendingCancel.name}</strong>. Dejará de
              estar disponible en la agenda y no se podrá
              volver a publicar.
            </>
          }
          confirmLabel="Cancelar evento"
          cancelLabel="Volver"
          danger
          onConfirm={() => handleCancel(pendingCancel)}
          onClose={() => setPendingCancel(null)}
        />
      )}

      {reservingEvent && (
        <Modal
          title="Inscribir socio"
          description="Selecciona un socio activo para reservar un cupo en el evento."
          onClose={() => setReservingEvent(null)}
        >
          <ReservationForm
            event={reservingEvent}
            onSubmit={handleCreateReservation}
            onCancel={() => setReservingEvent(null)}
          />
        </Modal>
      )}

      {reservationsEvent && (
        <EventReservationsModal
          event={reservationsEvent}
          reservations={eventReservations}
          onPay={handleRegisterPayment}
          onCancel={setPendingCancelReservation}
          onClose={() => setReservationsEvent(null)}
        />
      )}

      {pendingCancelReservation && (
        <ActionDialog
          title="Cancelar inscripción"
          description={
            <>
              Se cancelará la reserva de{' '}
              <strong>
                {formatMemberName(
                  pendingCancelReservation.member,
                )}
              </strong>
              . El cupo volverá a estar disponible y el
              historial de pagos se conservará.
            </>
          }
          confirmLabel="Cancelar inscripción"
          cancelLabel="Volver"
          danger
          onConfirm={() => handleCancelReservation()}
          onClose={() => setPendingCancelReservation(null)}
        />
      )}
    </div>
  );
}
