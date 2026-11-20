import { useState, type FormEvent } from 'react';

import type {
  CreateEventPaymentRequest,
  EventPaymentMethod,
  Reservation,
} from '../../types/reservation';
import {
  PAYMENT_METHOD_OPTIONS,
  formatCurrency,
  formatMemberName,
  getPaidAmount,
  getPendingAmount,
} from '../../utils/reservations';

interface PaymentFormProps {
  reservation: Reservation;
  eventName: string;
  onSubmit: (data: CreateEventPaymentRequest) => Promise<void>;
  onCancel: () => void;
}

export function PaymentForm({
  reservation,
  eventName,
  onSubmit,
  onCancel,
}: PaymentFormProps) {
  const pending = getPendingAmount(reservation);

  const [amount, setAmount] = useState(pending.toFixed(2));
  const [method, setMethod] =
    useState<EventPaymentMethod>('CASH');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (
    formEvent: FormEvent<HTMLFormElement>,
  ) => {
    formEvent.preventDefault();

    const normalized = amount.trim().replace(',', '.');

    if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
      setError('Indica un importe válido con hasta 2 decimales.');
      return;
    }

    const value = Number(normalized);

    if (value <= 0) {
      setError('El importe debe ser mayor que cero.');
      return;
    }

    if (value > pending) {
      setError(
        `El importe no puede superar el saldo de ${formatCurrency(pending)}.`,
      );
      return;
    }

    try {
      setLoading(true);
      setError('');

      await onSubmit({
        amount: value,
        method,
        ...(reference.trim()
          ? { reference: reference.trim() }
          : {}),
        ...(notes.trim() ? { notes: notes.trim() } : {}),
      });
    } catch (err) {
      setError(
        err instanceof Error && err.message
          ? err.message
          : 'No se pudo registrar el pago.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="form payment-form" onSubmit={handleSubmit}>
      <div className="reservation-event-summary">
        <span>Pago de inscripción de</span>
        <strong>{formatMemberName(reservation.member)}</strong>
        <small>{eventName}</small>
      </div>

      <div className="reservation-payment-totals">
        <div>
          <span>Importe</span>
          <strong>
            {formatCurrency(reservation.amount)}
          </strong>
        </div>

        <div>
          <span>Abonado</span>
          <strong>{formatCurrency(getPaidAmount(reservation))}</strong>
        </div>

        <div>
          <span>Saldo</span>
          <strong>{formatCurrency(pending)}</strong>
        </div>
      </div>

      <div className="form-grid">
        <div className="form-group">
          <label htmlFor="event-payment-amount">
            Importe a abonar (S/)
          </label>

          <input
            id="event-payment-amount"
            name="amount"
            type="number"
            inputMode="decimal"
            min="0.01"
            max={pending}
            step="0.01"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="event-payment-method">Método</label>

          <select
            id="event-payment-method"
            name="method"
            value={method}
            onChange={(event) =>
              setMethod(event.target.value as EventPaymentMethod)
            }
          >
            {PAYMENT_METHOD_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group form-full">
          <label htmlFor="event-payment-reference">
            Referencia (opcional)
          </label>

          <input
            id="event-payment-reference"
            name="reference"
            maxLength={100}
            placeholder="Ej. YAPE-20261119-001"
            value={reference}
            onChange={(event) => setReference(event.target.value)}
          />
        </div>

        <div className="form-group form-full">
          <label htmlFor="event-payment-notes">
            Observaciones (opcional)
          </label>

          <textarea
            id="event-payment-notes"
            name="notes"
            rows={2}
            maxLength={500}
            placeholder="Detalles del abono"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
        </div>
      </div>

      {error && (
        <div
          id="event-payment-error"
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
          Volver
        </button>

        <button
          type="submit"
          className="button primary"
          disabled={loading}
          aria-describedby={error ? 'event-payment-error' : undefined}
        >
          {loading ? 'Registrando...' : 'Registrar pago'}
        </button>
      </div>
    </form>
  );
}
