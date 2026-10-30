import { useEffect, useMemo, useState } from 'react';

import type { Member } from '../../types/member';
import type {
  CreatePaymentRequest,
  Payment,
  PaymentMethod,
} from '../../types/payment';
import type { Membership } from '../../types/membership';
import { todayDateKey, toDateKey } from '../../utils/date';

interface PaymentFormProps {
  members: Member[];
  memberships: Membership[];
  onSubmit: (data: CreatePaymentRequest) => Promise<void>;
  submitting: boolean;
  initialPayment?: Payment | null;
}

const paymentMethods: {
  value: PaymentMethod;
  label: string;
}[] = [
  { value: 'CASH', label: 'Efectivo' },
  { value: 'CARD', label: 'Tarjeta' },
  { value: 'TRANSFER', label: 'Transferencia' },
  { value: 'YAPE', label: 'Yape' },
  { value: 'PLIN', label: 'Plin' },
  { value: 'OTHER', label: 'Otro' },
];

export function PaymentForm({
  members,
  memberships,
  onSubmit,
  submitting,
  initialPayment,
}: PaymentFormProps) {
  const [memberId, setMemberId] = useState(
    initialPayment?.memberId ?? '',
  );

  const [membershipId, setMembershipId] = useState(
    initialPayment?.membershipId ?? '',
  );

  const [amount, setAmount] = useState(
    initialPayment
      ? String(initialPayment.amount)
      : '',
  );

  const [method, setMethod] = useState<PaymentMethod>(
    initialPayment?.method ?? 'CASH',
  );

  const [reference, setReference] = useState(
    initialPayment?.reference ?? '',
  );

  const [notes, setNotes] = useState(
    initialPayment?.notes ?? '',
  );

  const [formError, setFormError] = useState('');

  const filteredMemberships = useMemo(() => {
    if (!memberId) {
      return [];
    }

    return memberships.filter(
      (membership) =>
        membership.memberId === memberId &&
        membership.status !== 'CANCELLED',
    );
  }, [memberships, memberId]);

  const selectedMembership = useMemo(
    () =>
      filteredMemberships.find(
        (membership) => membership.id === membershipId,
      ) ?? null,
    [filteredMemberships, membershipId],
  );

  const selectedPrice = selectedMembership
    ? Number(
        selectedMembership.price ??
          selectedMembership.plan.price,
      )
    : 0;

  const selectedPaid = Number(
    selectedMembership?.paidAmount ?? 0,
  );

  const selectedBalance =
    selectedMembership?.balance !== undefined
      ? Number(selectedMembership.balance)
      : Math.max(selectedPrice - selectedPaid, 0);

  const selectedIsExpired = selectedMembership
    ? toDateKey(selectedMembership.endDate) <
      todayDateKey()
    : false;

  useEffect(() => {
    if (
      membershipId &&
      !filteredMemberships.some(
        (membership) => membership.id === membershipId,
      )
    ) {
      setMembershipId('');
      setAmount('');
    }
  }, [filteredMemberships, membershipId]);

  const handleMemberChange = (
    value: string,
  ) => {
    setMemberId(value);
    setMembershipId('');
    setAmount('');
    setFormError('');
  };

  const handleMembershipChange = (
    value: string,
  ) => {
    setMembershipId(value);
    setFormError('');

    const membership = filteredMemberships.find(
      (item) => item.id === value,
    );

    if (membership) {
      const balance = Number(membership.balance ?? 0);

      setAmount(
        balance > 0 ? balance.toFixed(2) : '',
      );
    }
  };

  const handleSubmit = async (
    event: React.FormEvent,
  ) => {
    event.preventDefault();

    setFormError('');

    if (!memberId) {
      setFormError('Selecciona un miembro.');
      return;
    }

    if (!membershipId) {
      setFormError('Selecciona una membresía.');
      return;
    }

    const paymentAmount = Number(amount);

    if (!amount || paymentAmount <= 0) {
      setFormError(
        'El monto del pago debe ser mayor a cero.',
      );
      return;
    }

    if (selectedBalance <= 0) {
      setFormError(
        'La membresía no tiene saldo pendiente.',
      );
      return;
    }

    if (paymentAmount > selectedBalance) {
      setFormError(
        `El monto supera el saldo pendiente de S/ ${selectedBalance.toFixed(
          2,
        )}.`,
      );
      return;
    }

    try {
      await onSubmit({
        membershipId,
        amount: paymentAmount,
        method,
        reference: reference.trim() || undefined,
        notes: notes.trim() || undefined,
      });
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : 'No se pudo registrar el pago.',
      );
      return;
    }

    setMemberId('');
    setMembershipId('');
    setAmount('');
    setMethod('CASH');
    setReference('');
    setNotes('');
  };

  return (
    <form
      className="form-grid"
      onSubmit={handleSubmit}
    >
      <div className="form-group">
        <label>Miembro</label>

        <select
          value={memberId}
          onChange={(event) =>
            handleMemberChange(event.target.value)
          }
          required
        >
          <option value="">
            Seleccionar miembro
          </option>

          {members.map((member) => (
            <option
              key={member.id}
              value={member.id}
            >
              {member.firstName} {member.lastName}
              {member.documentNumber
                ? ` - ${member.documentNumber}`
                : ''}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>Membresía</label>

        <select
          value={membershipId}
          onChange={(event) =>
            handleMembershipChange(event.target.value)
          }
          disabled={!memberId}
          required
        >
          <option value="">
            {memberId
              ? 'Seleccionar membresía'
              : 'Primero selecciona un miembro'}
          </option>

          {filteredMemberships.map((membership) => {
            const membershipPrice = Number(
              membership.price ??
                membership.plan.price,
            );
            const membershipPaid = Number(
              membership.paidAmount ?? 0,
            );
            const balance = Number(
              membership.balance ??
                Math.max(
                  membershipPrice - membershipPaid,
                  0,
                ),
            );

            return (
              <option
                key={membership.id}
                value={membership.id}
                disabled={balance <= 0}
              >
                {membership.plan.name} —{' '}
                {balance > 0
                  ? `Saldo S/ ${balance.toFixed(2)}`
                  : 'Pagada'}
                {' '}({membership.startDate.slice(0, 10)}
                {' '}→ {membership.endDate.slice(0, 10)})
              </option>
            );
          })}
        </select>
      </div>

      {selectedMembership && (
        <div className="form-group full-width">
          <div className="membership-payment-summary">
            <span>
              Precio:{' '}
              <strong>
                S/ {selectedPrice.toFixed(2)}
              </strong>
            </span>
            <span>
              Pagado:{' '}
              <strong>
                S/ {selectedPaid.toFixed(2)}
              </strong>
            </span>
            <span>
              Saldo:{' '}
              <strong>
                S/ {selectedBalance.toFixed(2)}
              </strong>
            </span>
          </div>

          {selectedIsExpired && (
            <p className="warning-message">
              Membresía vencida: este pago se
              registrará como regularización.
            </p>
          )}

          {selectedBalance <= 0 && (
            <p className="info-message">
              Esta membresía ya no tiene saldo
              pendiente.
            </p>
          )}
        </div>
      )}

      <div className="form-group">
        <label>Monto</label>

        <input
          type="number"
          min="0.01"
          max={
            selectedBalance > 0
              ? selectedBalance.toFixed(2)
              : undefined
          }
          step="0.01"
          value={amount}
          onChange={(event) =>
            setAmount(event.target.value)
          }
          required
        />
      </div>

      <div className="form-group">
        <label>Método de pago</label>

        <select
          value={method}
          onChange={(event) =>
            setMethod(
              event.target.value as PaymentMethod,
            )
          }
          required
        >
          {paymentMethods.map((item) => (
            <option
              key={item.value}
              value={item.value}
            >
              {item.label}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>Referencia</label>

        <input
          type="text"
          value={reference}
          onChange={(event) =>
            setReference(event.target.value)
          }
          placeholder="Ej. YAPE-001"
          maxLength={100}
        />
      </div>

      <div className="form-group">
        <label>Notas</label>

        <textarea
          value={notes}
          onChange={(event) =>
            setNotes(event.target.value)
          }
          placeholder="Observaciones del pago"
          maxLength={255}
          rows={3}
        />
      </div>

      {formError && (
        <div className="error-message full-width">
          {formError}
        </div>
      )}

      <div className="form-actions">
        <button
          type="submit"
          className="primary-button"
          disabled={submitting}
        >
          {submitting
            ? 'Registrando...'
            : 'Registrar pago'}
        </button>
      </div>
    </form>
  );
}