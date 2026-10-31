import { useEffect, useMemo, useState } from 'react';

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
import { MembershipForm } from './MembershipForm';
import { MembershipTable } from './MembershipTable';

export function MembershipsPage() {
  const { isAdmin } = useAuth();

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

  const loadData = async () => {
    try {
      setLoading(true);
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
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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

    await loadData();
  };

  const handleCancel = async (
    membership: Membership,
  ) => {
    const reason = window.prompt(
      `Motivo de la cancelación de la membresía de ${membership.member.firstName} ${membership.member.lastName}:`,
    );

    if (!reason?.trim()) {
      return;
    }

    try {
      setCancellingId(membership.id);
      setError('');

      await cancelMembership(
        membership.id,
        reason.trim(),
      );

      await loadData();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudo cancelar la membresía.',
      );
    } finally {
      setCancellingId(null);
    }
  };

  if (loading) {
    return (
      <div>
        Cargando membresías...
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
          onClick={() =>
            setShowForm(true)
          }
        >
          Nueva membresía
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="members-toolbar">
        <div className="search-box">
          <span>⌕</span>

          <input
            placeholder="Buscar por socio, DNI, código o plan..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />
        </div>

        <div className="members-count">
          {filteredMemberships.length} de{' '}
          {memberships.length} membresías
        </div>
      </div>

      {showForm && (
        <div className="modal-backdrop">
          <div className="modal">
            <h2>
              Nueva membresía
            </h2>

            <MembershipForm
              members={members}
              plans={plans}
              onSubmit={handleCreate}
              onCancel={() =>
                setShowForm(false)
              }
            />
          </div>
        </div>
      )}

      <MembershipTable
        memberships={filteredMemberships}
        canCancel={isAdmin}
        onCancel={handleCancel}
        cancellingId={cancellingId}
      />
    </section>
  );
}