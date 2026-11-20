import { useState } from 'react';

import {
  Ban,
  ChevronDown,
  CreditCard,
  History,
} from 'lucide-react';

import type { GymEvent } from '../../types/event';
import type {
  CreateEventPaymentRequest,
  Reservation,
} from '../../types/reservation';
import { formatDateTime } from '../../utils/date';
import { formatEventDate } from '../../utils/events';
import {
  PAYMENT_METHOD_LABELS,
  RESERVATION_PAYMENT_STATUS_LABELS,
  RESERVATION_STATUS_LABELS,
  canCancelReservation,
  canRegisterPayment,
  formatCurrency,
  formatMemberName,
  formatReservedAt,
  getPaidAmount,
  isReservationActive,
  reservationPaymentStatusClass,
  reservationStatusClass,
} from '../../utils/reservations';

import { EmptyState } from '../ui/EmptyState';
import { Modal } from '../ui/Modal';

import { PaymentForm } from './PaymentForm';

interface EventReservationsModalProps {
  event: GymEvent;
  reservations: Reservation[];
  onPay: (
    id: string,
    data: CreateEventPaymentRequest,
  ) => Promise<void>;
  onCancel: (reservation: Reservation) => void;
  onClose: () => void;
}

const STATUS_ORDER: Record<
  Reservation['status'],
  number
> = {
  CONFIRMED: 0,
  PENDING_PAYMENT: 1,
  CANCELLED: 2,
};

export function EventReservationsModal({
  event,
  reservations,
  onPay,
  onCancel,
  onClose,
}: EventReservationsModalProps) {
  const [payingId, setPayingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(
    null,
  );

  const paying = payingId
    ? reservations.find((item) => item.id === payingId) ?? null
    : null;

  const ordered = [...reservations].sort((first, second) => {
    const statusDifference =
      STATUS_ORDER[first.status] - STATUS_ORDER[second.status];

    if (statusDifference !== 0) {
      return statusDifference;
    }

    return (
      new Date(first.reservedAt).getTime() -
      new Date(second.reservedAt).getTime()
    );
  });

  const active = ordered.filter(isReservationActive);
  const pending = active.filter(
    (item) =>
      item.paymentStatus !== 'PAID' &&
      item.paymentStatus !== 'NOT_REQUIRED',
  );
  const collected = active.reduce(
    (total, item) => total + getPaidAmount(item),
    0,
  );

  const handlePay = async (data: CreateEventPaymentRequest) => {
    if (!paying) {
      return;
    }

    await onPay(paying.id, data);
    setPayingId(null);
  };

  return (
    <Modal
      title={
        paying
          ? 'Registrar pago de inscripción'
          : `Reservas de ${event.name}`
      }
      description={
        paying
          ? 'El importe abonado se suma al historial de la reserva.'
          : `${formatEventDate(event.startDate)} · ${active.length} de ${event.capacity} cupos ocupados`
      }
      className="reservations-modal"
      onClose={onClose}
    >
      {paying ? (
        <PaymentForm
          reservation={paying}
          eventName={event.name}
          onSubmit={handlePay}
          onCancel={() => setPayingId(null)}
        />
      ) : (
        <div className="reservation-panel">
          <div className="reservation-summary">
            <div>
              <span>Inscritos</span>
              <strong>{active.length}</strong>
            </div>

            <div>
              <span>Confirmadas</span>
              <strong>
                {
                  active.filter(
                    (item) => item.status === 'CONFIRMED',
                  ).length
                }
              </strong>
            </div>

            <div>
              <span>Pendientes de pago</span>
              <strong>{pending.length}</strong>
            </div>

            <div>
              <span>Recaudado</span>
              <strong>{formatCurrency(collected)}</strong>
            </div>
          </div>

          {ordered.length === 0 ? (
            <EmptyState
              compact
              icon="🎟️"
              title="Sin inscripciones todavía"
              description="Cuando inscribas socios en este evento, aparecerán aquí con su estado y pagos."
            />
          ) : (
            <div className="reservation-list">
              {ordered.map((reservation) => {
                const expanded =
                  expandedId === reservation.id;
                const payments = [...reservation.payments].sort(
                  (first, second) =>
                    new Date(second.paymentDate).getTime() -
                    new Date(first.paymentDate).getTime(),
                );

                return (
                  <article
                    className={[
                      'reservation-item',
                      isReservationActive(reservation)
                        ? ''
                        : 'reservation-item--cancelled',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    key={reservation.id}
                  >
                    <div className="reservation-person">
                      <strong>
                        {formatMemberName(reservation.member)}
                      </strong>
                      <small>
                        {reservation.member.memberCode} ·{' '}
                        {formatReservedAt(reservation)}
                      </small>
                    </div>

                    <div className="reservation-badges">
                      <span
                        className={`status-badge ${reservationStatusClass(
                          reservation.status,
                        )}`}
                      >
                        {
                          RESERVATION_STATUS_LABELS[
                            reservation.status
                          ]
                        }
                      </span>

                      <span
                        className={`status-badge ${reservationPaymentStatusClass(
                          reservation.paymentStatus,
                        )}`}
                      >
                        {
                          RESERVATION_PAYMENT_STATUS_LABELS[
                            reservation.paymentStatus
                          ]
                        }
                      </span>
                    </div>

                    <div className="reservation-amount">
                      <strong>
                        {formatCurrency(reservation.amount)}
                      </strong>
                      <small>
                        Abonado{' '}
                        {formatCurrency(getPaidAmount(reservation))}
                      </small>
                    </div>

                    <div className="table-actions reservation-actions">
                      {canRegisterPayment(reservation) && (
                        <button
                          type="button"
                          className="table-action event-action-reserve"
                          onClick={() =>
                            setPayingId(reservation.id)
                          }
                        >
                          <CreditCard
                            size={14}
                            aria-hidden="true"
                          />
                          Pagar
                        </button>
                      )}

                      <button
                        type="button"
                        className="table-action"
                        aria-expanded={expanded}
                        onClick={() =>
                          setExpandedId(
                            expanded ? null : reservation.id,
                          )
                        }
                      >
                        <History size={14} aria-hidden="true" />
                        Historial
                        <ChevronDown
                          size={13}
                          className={
                            expanded
                              ? 'is-expanded'
                              : undefined
                          }
                          aria-hidden="true"
                        />
                      </button>

                      {canCancelReservation(reservation) && (
                        <button
                          type="button"
                          className="table-action danger"
                          onClick={() => onCancel(reservation)}
                        >
                          <Ban size={14} aria-hidden="true" />
                          Cancelar
                        </button>
                      )}
                    </div>

                    {expanded && (
                      <div className="reservation-history">
                        {payments.length === 0 ? (
                          <p>
                            Todavía no hay pagos registrados para
                            esta inscripción.
                          </p>
                        ) : (
                          <ul className="payment-history">
                            {payments.map((payment) => (
                              <li
                                className="payment-history-item"
                                key={payment.id}
                              >
                                <div>
                                  <strong>
                                    {formatCurrency(
                                      payment.amount,
                                    )}
                                  </strong>
                                  <small>
                                    {formatDateTime(
                                      payment.paymentDate,
                                    )}{' '}
                                    ·{' '}
                                    {
                                      PAYMENT_METHOD_LABELS[
                                        payment.method
                                      ]
                                    }
                                  </small>
                                </div>

                                {(payment.reference ||
                                  payment.notes) && (
                                  <span className="payment-history-detail">
                                    {payment.reference}
                                    {payment.reference &&
                                    payment.notes
                                      ? ' · '
                                      : ''}
                                    {payment.notes}
                                  </span>
                                )}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
