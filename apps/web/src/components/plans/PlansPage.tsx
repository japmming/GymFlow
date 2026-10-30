import { useEffect, useState } from 'react';

import {
  createPlan,
  deactivatePlan,
  getPlans,
  updatePlan,
} from '../../services/api';

import type {
  CreatePlanRequest,
  Plan,
} from '../../types/plan';

import { PlanForm } from './PlanForm';
import { PlanTable } from './PlanTable';

export function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
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

      {(showForm || editingPlan) && (
        <div className="modal-backdrop">
          <div className="modal">
            <h2>
              {editingPlan
                ? 'Editar plan'
                : 'Nuevo plan'}
            </h2>

            <PlanForm
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
        plans={plans}
        onEdit={(plan) => {
          setEditingPlan(plan);
          setShowForm(false);
        }}
        onDeactivate={handleDeactivate}
      />
    </section>
  );
}