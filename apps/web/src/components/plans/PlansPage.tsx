import { useCallback, useEffect, useMemo, useState } from 'react';

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

import { ActionDialog } from '../ui/ActionDialog';
import { LoadingState } from '../ui/LoadingState';
import { SearchField } from '../ui/SearchField';
import { useToast } from '../ui/ToastProvider';
import { Modal } from '../ui/Modal';
import { PlanForm } from './PlanForm';
import { PlanTable } from './PlanTable';

type PlanAction = 'deactivate' | 'reactivate';

export function PlansPage() {
  const { notify } = useToast();

  const [plans, setPlans] = useState<Plan[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editingPlan, setEditingPlan] =
    useState<Plan | null>(null);

  const [pendingAction, setPendingAction] = useState<{
    plan: Plan;
    action: PlanAction;
  } | null>(null);

  const loadPlans = useCallback(
    async (mode: 'initial' | 'refresh' = 'initial') => {
      try {
        if (mode === 'initial') {
          setLoading(true);
        }

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
        if (mode === 'initial') {
          setLoading(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    void loadPlans('initial');
  }, [loadPlans]);

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

    await loadPlans('refresh');

    notify('Plan creado correctamente.');
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

    await loadPlans('refresh');

    notify('Plan actualizado correctamente.');
  };

  const handleDeactivate = async (
    plan: Plan,
  ) => {
    await deactivatePlan(plan.id);

    await loadPlans('refresh');

    notify(`El plan "${plan.name}" fue desactivado.`);
  };

  const handleReactivate = async (
    plan: Plan,
  ) => {
    await reactivatePlan(plan.id);

    await loadPlans('refresh');

    notify(`El plan "${plan.name}" fue reactivado.`);
  };

  if (loading) {
    return (
      <div className="page-container">
        <LoadingState label="Cargando planes..." />
      </div>
    );
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
          className="button primary"
          onClick={() => {
            setEditingPlan(null);
            setShowForm(true);
          }}
        >
          Nuevo plan
        </button>
      </div>

      {error && (
        <div className="error-message" role="alert">
          {error}
        </div>
      )}

      <div className="members-toolbar">
        <SearchField
          label="Buscar planes"
          placeholder="Buscar por nombre o descripción..."
          value={search}
          onChange={setSearch}
        />

        <div className="members-count" aria-live="polite">
          {filteredPlans.length} de {plans.length} planes
        </div>
      </div>

      {(showForm || editingPlan) && (
        <Modal
          title={
            editingPlan ? 'Editar plan' : 'Nuevo plan'
          }
          description="Define el precio y la duración del plan."
          onClose={() => {
            setShowForm(false);
            setEditingPlan(null);
          }}
        >
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
        </Modal>
      )}

      <PlanTable
        plans={filteredPlans}
        onEdit={(plan) => {
          setEditingPlan(plan);
          setShowForm(false);
        }}
        onDeactivate={(plan) =>
          setPendingAction({
            plan,
            action: 'deactivate',
          })
        }
        onReactivate={(plan) =>
          setPendingAction({
            plan,
            action: 'reactivate',
          })
        }
      />

      {pendingAction && (
        <ActionDialog
          title={
            pendingAction.action === 'deactivate'
              ? 'Desactivar plan'
              : 'Reactivar plan'
          }
          description={
            pendingAction.action === 'deactivate'
              ? `El plan "${pendingAction.plan.name}" dejará de estar disponible para nuevas membresías.`
              : `El plan "${pendingAction.plan.name}" volverá a estar disponible para nuevas membresías.`
          }
          confirmLabel={
            pendingAction.action === 'deactivate'
              ? 'Desactivar'
              : 'Reactivar'
          }
          danger={pendingAction.action === 'deactivate'}
          onConfirm={() =>
            pendingAction.action === 'deactivate'
              ? handleDeactivate(pendingAction.plan)
              : handleReactivate(pendingAction.plan)
          }
          onClose={() => setPendingAction(null)}
        />
      )}
    </section>
  );
}