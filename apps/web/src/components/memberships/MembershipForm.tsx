import { useState } from 'react';

import type { Member } from '../../types/member';
import type { Plan } from '../../types/plan';
import type { CreateMembershipRequest } from '../../types/membership';
import { todayDateKey } from '../../utils/date';

interface MembershipFormProps {
  members: Member[];
  plans: Plan[];
  onSubmit: (
    data: CreateMembershipRequest,
  ) => Promise<void>;
  onCancel: () => void;
}

export function MembershipForm({
  members,
  plans,
  onSubmit,
  onCancel,
}: MembershipFormProps) {
  const [memberId, setMemberId] = useState('');
  const [planId, setPlanId] = useState('');
  const [startDate, setStartDate] = useState(
    todayDateKey(),
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const activePlans = plans.filter(
    (plan) => plan.active,
  );

  const handleSubmit = async (
    event: React.FormEvent,
  ) => {
    event.preventDefault();

    setError('');

    if (!memberId) {
      setError('Selecciona un miembro.');
      return;
    }

    if (!planId) {
      setError('Selecciona un plan.');
      return;
    }

    if (!startDate) {
      setError('Selecciona una fecha de inicio.');
      return;
    }

    try {
      setLoading(true);

      await onSubmit({
        memberId,
        planId,
        startDate,
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudo crear la membresía.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="form"
    >
      <div className="form-group">
        <label htmlFor="membership-member">
          Miembro
        </label>

        <select
          id="membership-member"
          value={memberId}
          onChange={(e) =>
            setMemberId(e.target.value)
          }
        >
          <option value="">
            Seleccionar miembro
          </option>

          {members
            .filter(
              (member) =>
                member.status === 'ACTIVE',
            )
            .map((member) => (
              <option
                key={member.id}
                value={member.id}
              >
                {member.firstName}{' '}
                {member.lastName}
                {member.documentNumber
                  ? ` - ${member.documentNumber}`
                  : ''}
              </option>
            ))}
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="membership-plan">
          Plan
        </label>

        <select
          id="membership-plan"
          value={planId}
          onChange={(e) =>
            setPlanId(e.target.value)
          }
        >
          <option value="">
            Seleccionar plan
          </option>

          {activePlans.map((plan) => (
            <option
              key={plan.id}
              value={plan.id}
            >
              {plan.name} - S/{' '}
              {Number(plan.price).toFixed(2)}{' '}
              ({plan.durationDays} días)
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="membership-start-date">
          Fecha de inicio
        </label>

        <input
          id="membership-start-date"
          type="date"
          min={todayDateKey()}
          value={startDate}
          onChange={(e) =>
            setStartDate(e.target.value)
          }
        />
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="form-actions">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
        >
          Cancelar
        </button>

        <button
          type="submit"
          disabled={loading}
        >
          {loading
            ? 'Creando...'
            : 'Crear membresía'}
        </button>
      </div>
    </form>
  );
}