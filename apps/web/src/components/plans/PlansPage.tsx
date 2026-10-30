import { useEffect, useMemo, useState } from 'react';

import {
  createPlan,
  deactivatePlan,
  getPlans,
  reactivatePlan,
  updatePlan,
} from '../../services/api';

import type {
  CreatePlanRequest,
  Plan,
} from '../../types/plan';

import { matchesSearch } from '../../utils/search';

import { PlanForm } from './PlanForm';
import { PlanTable } from './PlanTable';

export function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editingPlan, setEditingPlan] =
    useState<Plan | null>(null);

  const loadPlans = async () => {
    try {
      setLoading(true);
      setError('');

      const data = await getPlans();

      setPlans(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudieron cargar los planes.',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const filteredPlans = useMemo(
    () =>
      plans.filter((plan) =>
        matchesSearch(
          [plan.name, plan.description],
          search,
        ),
      ),
    [plans, search],
  );

  const handleCreate = async (
    data: CreatePlanRequest,
  ) => {
    await createPlan(data);

    setShowForm(false);

    await loadPlans();
  };

  const handleUpdate = async (
    data: CreatePlanRequest,
  ) => {
    if (!editingPlan) {
      return;
    }

    await updatePlan(
      editingPlan.id,
      data,
    );

    setEditingPlan(null);

    await loadPlans();
  };

  const handleDeactivate = async (
    plan: Plan,
  ) => {
    const confirmed = window.confirm(
      `¿Deseas desactivar el plan "${plan.name}"?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await deactivatePlan(plan.id);

      await loadPlans();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudo desactivar el plan.',
      );
    }
  };

  const handleReactivate = async (
    plan: Plan,
  ) => {
    const confirmed = window.confirm(
      `¿Deseas reactivar el plan "${plan.name}"?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await reactivatePlan(plan.id);

      await loadPlans();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudo reactivar el plan.',
      );
    }
  };

  if (loading) {
    return <div>Cargando planes...</div>;
  }

  return (
    <section>
      <div className="page-header">
        <div>
          <h1>Planes</h1>

          <p>
            Gestiona los planes disponibles
            para los miembros.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingPlan(null);
            setShowForm(true);
          }}
        >
          Nuevo plan
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
            placeholder="Buscar por nombre o descripción..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />
        </div>

        <div className="members-count">
          {filteredPlans.length} de {plans.length} planes
        </div>
      </div>

      {(showForm || editingPlan) && (
        <div className="modal-backdrop">
          <div className="modal">
            <h2>
              {editingPlan
                ? 'Editar plan'
                : 'Nuevo plan'}
            </h2>

            <PlanForm
              plan={editingPlan}
              onSubmit={
                editingPlan
                  ? handleUpdate
                  : handleCreate
              }
              onCancel={() => {
                setShowForm(false);
                setEditingPlan(null);
              }}
            />
          </div>
        </div>
      )}

      <PlanTable
        plans={filteredPlans}
        onEdit={(plan) => {
          setEditingPlan(plan);
          setShowForm(false);
        }}
        onDeactivate={handleDeactivate}
        onReactivate={handleReactivate}
      />
    </section>
  );
}