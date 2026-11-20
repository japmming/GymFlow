import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from 'react';

import { getMembers } from '../../services/api';
import type { GymEvent } from '../../types/event';
import type { Member } from '../../types/member';
import { formatEventDate, formatEventPrice } from '../../utils/events';
import { formatMemberName } from '../../utils/reservations';
import { matchesSearch } from '../../utils/search';

interface ReservationFormProps {
  event: GymEvent;
  onSubmit: (memberId: string) => Promise<void>;
  onCancel: () => void;
}

export function ReservationForm({
  event,
  onSubmit,
  onCancel,
}: ReservationFormProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [search, setSearch] = useState('');
  const [memberId, setMemberId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const data = await getMembers();

        if (active) {
          setMembers(data.filter((item) => item.status === 'ACTIVE'));
        }
      } catch (err) {
        if (active) {
          console.error(err);
          setError(
            'No se pudo cargar la lista de socios. Inténtalo de nuevo.',
          );
        }
      } finally {
        if (active) {
          setLoadingMembers(false);
        }
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, []);

  const visibleMembers = useMemo(
    () =>
      members.filter((member) =>
        matchesSearch(
          [
            formatMemberName(member),
            member.memberCode,
            member.documentNumber,
          ],
          search,
        ),
      ),
    [members, search],
  );

  const handleSubmit = async (
    formEvent: FormEvent<HTMLFormElement>,
  ) => {
    formEvent.preventDefault();

    if (!memberId) {
      setError('Selecciona un socio para la inscripción.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      await onSubmit(memberId);
    } catch (err) {
      setError(
        err instanceof Error && err.message
          ? err.message
          : 'No se pudo registrar la inscripción.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="form reservation-form" onSubmit={handleSubmit}>
      <div className="reservation-event-summary">
        <span>Inscripción en</span>
        <strong>{event.name}</strong>
        <small>
          {formatEventDate(event.startDate)} ·{' '}
          {formatEventPrice(event.price)}
          {event.requiresActiveMembership
            ? ' · Requiere membresía vigente'
            : ''}
        </small>
      </div>

      <div className="form-group">
        <label htmlFor="reservation-member-search">
          Buscar socio activo
        </label>

        <input
          id="reservation-member-search"
          type="search"
          placeholder="Nombre, código o documento..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          disabled={loadingMembers}
        />
      </div>

      <div className="form-group">
        <label htmlFor="reservation-member">Socio</label>

        <select
          id="reservation-member"
          name="memberId"
          value={memberId}
          onChange={(event) => setMemberId(event.target.value)}
          disabled={loadingMembers}
          required
        >
          <option value="">
            {loadingMembers
              ? 'Cargando socios...'
              : 'Selecciona un socio'}
          </option>

          {visibleMembers.map((member) => (
            <option key={member.id} value={member.id}>
              {formatMemberName(member)} · {member.memberCode}
            </option>
          ))}
        </select>

        {memberId && !visibleMembers.some((member) => member.id === memberId) && (
          <small className="field-hint">
            El socio seleccionado no coincide con la búsqueda.
          </small>
        )}
      </div>

      {error && (
        <div
          id="reservation-form-error"
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
          disabled={loading || loadingMembers}
          aria-describedby={
            error ? 'reservation-form-error' : undefined
          }
        >
          {loading ? 'Inscribiendo...' : 'Confirmar inscripción'}
        </button>
      </div>
    </form>
  );
}
