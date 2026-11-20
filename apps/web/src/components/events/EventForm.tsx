import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';

import type {
  CreateEventRequest,
  EventType,
  GymEvent,
} from '../../types/event';

import {
  EVENT_TYPE_OPTIONS,
  dateTimeLocalToIso,
  toDateTimeLocalValue,
} from '../../utils/events';

interface EventFormProps {
  event?: GymEvent | null;
  onSubmit: (data: CreateEventRequest) => Promise<void>;
  onCancel: () => void;
}

const EMPTY_VALUES = {
  name: '',
  description: '',
  type: 'CLASS' as EventType,
  startDate: '',
  endDate: '',
  capacity: '20',
  price: '0',
  requiresActiveMembership: false,
};

export function EventForm({
  event,
  onSubmit,
  onCancel,
}: EventFormProps) {
  const [name, setName] = useState(EMPTY_VALUES.name);
  const [description, setDescription] = useState(
    EMPTY_VALUES.description,
  );
  const [type, setType] = useState<EventType>(
    EMPTY_VALUES.type,
  );
  const [startDate, setStartDate] = useState(
    EMPTY_VALUES.startDate,
  );
  const [endDate, setEndDate] = useState(EMPTY_VALUES.endDate);
  const [capacity, setCapacity] = useState(
    EMPTY_VALUES.capacity,
  );
  const [price, setPrice] = useState(EMPTY_VALUES.price);
  const [requiresActiveMembership, setRequiresActiveMembership] =
    useState(EMPTY_VALUES.requiresActiveMembership);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (event) {
      setName(event.name);
      setDescription(event.description ?? '');
      setType(event.type);
      setStartDate(toDateTimeLocalValue(event.startDate));
      setEndDate(toDateTimeLocalValue(event.endDate));
      setCapacity(String(event.capacity));
      setPrice(String(Number(event.price)));
      setRequiresActiveMembership(
        event.requiresActiveMembership,
      );
      return;
    }

    setName(EMPTY_VALUES.name);
    setDescription(EMPTY_VALUES.description);
    setType(EMPTY_VALUES.type);
    setStartDate(EMPTY_VALUES.startDate);
    setEndDate(EMPTY_VALUES.endDate);
    setCapacity(EMPTY_VALUES.capacity);
    setPrice(EMPTY_VALUES.price);
    setRequiresActiveMembership(
      EMPTY_VALUES.requiresActiveMembership,
    );
  }, [event]);

  const handleSubmit = async (
    formEvent: FormEvent<HTMLFormElement>,
  ) => {
    formEvent.preventDefault();

    setError('');

    if (!name.trim()) {
      setError('El nombre del evento es obligatorio.');
      return;
    }

    if (!startDate || !endDate) {
      setError(
        'Indica la fecha y hora de inicio y de finalización.',
      );
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime())
    ) {
      setError('Las fechas del evento no son válidas.');
      return;
    }

    if (end.getTime() <= start.getTime()) {
      setError(
        'La fecha de finalización debe ser posterior al inicio.',
      );
      return;
    }

    const seats = Number(capacity);
    const eventPrice = Number(price);

    if (
      !Number.isInteger(seats) ||
      seats < 1 ||
      seats > 10000
    ) {
      setError('Los cupos deben ser un entero entre 1 y 10000.');
      return;
    }

    if (!Number.isFinite(eventPrice) || eventPrice < 0) {
      setError('El precio no es válido.');
      return;
    }

    try {
      setLoading(true);

      await onSubmit({
        name: name.trim(),
        description: description.trim() || null,
        type,
        startDate: dateTimeLocalToIso(startDate),
        endDate: dateTimeLocalToIso(endDate),
        capacity: seats,
        price: eventPrice,
        requiresActiveMembership,
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudo guardar el evento.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="form" onSubmit={handleSubmit}>
      <div className="form-grid">
        <div className="form-group form-full">
          <label htmlFor="event-name">Nombre del evento</label>

          <input
            id="event-name"
            name="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Ej. Clase de yoga"
            maxLength={150}
            autoFocus
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="event-type">Tipo</label>

          <select
            id="event-type"
            name="type"
            value={type}
            onChange={(event) =>
              setType(event.target.value as EventType)
            }
          >
            {EVENT_TYPE_OPTIONS.map((option) => (
              <option
                key={option.value}
                value={option.value}
              >
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="event-capacity">Cupos</label>

          <input
            id="event-capacity"
            name="capacity"
            type="number"
            inputMode="numeric"
            min="1"
            max="10000"
            step="1"
            value={capacity}
            onChange={(event) =>
              setCapacity(event.target.value)
            }
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="event-start">Inicio</label>

          <input
            id="event-start"
            name="startDate"
            type="datetime-local"
            value={startDate}
            onChange={(event) =>
              setStartDate(event.target.value)
            }
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="event-end">Fin</label>

          <input
            id="event-end"
            name="endDate"
            type="datetime-local"
            value={endDate}
            onChange={(event) =>
              setEndDate(event.target.value)
            }
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="event-price">
            Precio de inscripción (S/)
          </label>

          <input
            id="event-price"
            name="price"
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            value={price}
            onChange={(event) =>
              setPrice(event.target.value)
            }
            placeholder="0.00"
            required
          />
        </div>

        <div className="form-group form-full">
          <label htmlFor="event-description">
            Descripción
          </label>

          <textarea
            id="event-description"
            name="description"
            rows={3}
            maxLength={1000}
            value={description}
            onChange={(event) =>
              setDescription(event.target.value)
            }
            placeholder="Detalles del evento, nivel, materiales o indicaciones."
          />
        </div>
      </div>

      <label className="form-check">
        <input
          type="checkbox"
          name="requiresActiveMembership"
          checked={requiresActiveMembership}
          onChange={(event) =>
            setRequiresActiveMembership(event.target.checked)
          }
        />

        <span>
          <strong>Exigir membresía activa</strong>
          <small>
            Solo podrán inscribirse socios con una membresía
            vigente.
          </small>
        </span>
      </label>

      {error && (
        <div
          id="event-form-error"
          className="error-message"
          role="alert"
        >
          {error}
        </div>
      )}

      <div className="form-actions">
        <button
          type="button"
          className="button secondary"
          onClick={onCancel}
          disabled={loading}
        >
          Cancelar
        </button>

        <button
          type="submit"
          className="button primary"
          disabled={loading}
          aria-describedby={
            error ? 'event-form-error' : undefined
          }
        >
          {loading
            ? 'Guardando...'
            : event
              ? 'Guardar cambios'
              : 'Crear evento'}
        </button>
      </div>
    </form>
  );
}
