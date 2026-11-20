import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { useAuth } from '../../auth/AuthProvider';
import {
  cancelMembership,
  createMembership,
  getMembers,
  getMemberships,
  getPlans,
} from '../../services/api';

import type { Member } from '../../types/member';
import type { Plan } from '../../types/plan';
import type {
  CreateMembershipRequest,
  Membership,
} from '../../types/membership';
import { matchesSearch } from '../../utils/search';
import { ActionDialog } from '../ui/ActionDialog';
import { LoadingState } from '../ui/LoadingState';
import { SearchField } from '../ui/SearchField';
import { useToast } from '../ui/ToastProvider';
import { Modal } from '../ui/Modal';
import { MembershipForm } from './MembershipForm';
import { MembershipTable } from './MembershipTable';

export function MembershipsPage() {
  const { isAdmin } = useAuth();
  const { notify } = useToast();

  const [memberships, setMemberships] =
    useState<Membership[]>([]);

  const [search, setSearch] = useState('');

  const [members, setMembers] =
    useState<Member[]>([]);

  const [plans, setPlans] =
    useState<Plan[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  const [showForm, setShowForm] =
    useState(false);

  const [cancellingId, setCancellingId] =
    useState<string | null>(null);

  const [pendingCancel, setPendingCancel] =
    useState<Membership | null>(null);

  const loadData = useCallback(
    async (mode: 'initial' | 'refresh' = 'initial') => {
      try {
        if (mode === 'initial') {
          setLoading(true);
        }

        setError('');

        const [
          membershipsData,
          membersData,
          plansData,
        ] = await Promise.all([
          getMemberships(),
          getMembers(),
          getPlans(),
        ]);

        setMemberships(membershipsData);
        setMembers(membersData);
        setPlans(plansData);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'No se pudieron cargar los datos.',
        );
      } finally {
        if (mode === 'initial') {
          setLoading(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    void loadData('initial');
  }, [loadData]);

  const filteredMemberships = useMemo(
    () =>
      memberships.filter((membership) =>
        matchesSearch(
          [
            membership.member.firstName,
            membership.member.lastName,
            membership.member.documentNumber,
            membership.member.memberCode,
            membership.plan.name,
            membership.cancellationReason,
          ],
          search,
        ),
      ),
    [memberships, search],
  );

  const handleCreate = async (
    data: CreateMembershipRequest,
  ) => {
    await createMembership(data);

    setShowForm(false);

    await loadData('refresh');

    notify('Membresía registrada correctamente.');
  };

  const handleCancel = async (
    membership: Membership,
    reason: string,
  ) => {
    try {
      setCancellingId(membership.id);

      await cancelMembership(membership.id, reason);

      await loadData('refresh');

      notify(
        `La membresía de ${membership.member.firstName} ${membership.member.lastName} fue cancelada.`,
      );
    } finally {
      setCancellingId(null);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <LoadingState label="Cargando membresías..." />
      </div>
    );
  }

  return (
    <section>
      <div className="page-header">
        <div>
          <h1>Membresías</h1>

          <p>
            Gestiona la vigencia de los
            miembros.
          </p>
        </div>

        <button
          type="button"
          className="button primary"
          onClick={() =>
            setShowForm(true)
          }
        >
          Nueva membresía
        </button>
      </div>

      {error && (
        <div className="error-message" role="alert">
          {error}
        </div>
      )}

      <div className="members-toolbar">
        <SearchField
          label="Buscar membresías"
          placeholder="Buscar por socio, DNI, código o plan..."
          value={search}
          onChange={setSearch}
        />

        <div className="members-count" aria-live="polite">
          {filteredMemberships.length} de{' '}
          {memberships.length} membresías
        </div>
      </div>

      {showForm && (
        <Modal
          title="Nueva membresía"
          description="Asocia un plan a un miembro activo."
          onClose={() => setShowForm(false)}
        >
          <MembershipForm
            members={members}
            plans={plans}
            onSubmit={handleCreate}
            onCancel={() =>
              setShowForm(false)
            }
          />
        </Modal>
      )}

      <MembershipTable
        memberships={filteredMemberships}
        canCancel={isAdmin}
        onCancel={setPendingCancel}
        cancellingId={cancellingId}
      />

      {pendingCancel && (
        <ActionDialog
          title="Cancelar membresía"
          description={
            <>
              <strong>
                {pendingCancel.member.firstName}{' '}
                {pendingCancel.member.lastName}
              </strong>{' '}
              dejará de tener una membresía vigente. Indica el
              motivo para dejar registro.
            </>
          }
          confirmLabel="Cancelar membresía"
          cancelLabel="Volver"
          danger
          reason={{
            label: 'Motivo de la cancelación',
            placeholder: 'Ej. El socio solicitó la cancelación',
            required: true,
            maxLength: 240,
          }}
          onConfirm={(reason) =>
            handleCancel(pendingCancel, reason)
          }
          onClose={() => setPendingCancel(null)}
        />
      )}
    </section>
  );
}