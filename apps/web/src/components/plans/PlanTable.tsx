import type { Plan } from '../../types/plan';
import { EmptyState } from '../ui/EmptyState';

interface PlanTableProps {
  plans: Plan[];
  onEdit: (plan: Plan) => void;
  onDeactivate: (plan: Plan) => void;
  onReactivate: (plan: Plan) => void;
}

export function PlanTable({
  plans,
  onEdit,
  onDeactivate,
  onReactivate,
}: PlanTableProps) {
  if (plans.length === 0) {
    return (
      <EmptyState
        icon="🏷"
        title="No hay planes registrados"
        description="Crea un plan para poder asignarlo a las membresías."
      />
    );
  }

  return (
    <div className="table-container">
      <table>
        <caption className="sr-only">
          Planes disponibles
        </caption>
        <thead>
          <tr>
            <th scope="col">Nombre</th>
            <th scope="col">Duración</th>
            <th scope="col" className="table-number">
              Precio
            </th>
            <th scope="col">Estado</th>
            <th scope="col">Acciones</th>
          </tr>
        </thead>

        <tbody>
          {plans.map((plan) => (
            <tr key={plan.id}>
              <td>
                <strong>{plan.name}</strong>

                {plan.description && (
                  <div className="table-description">
                    {plan.description}
                  </div>
                )}
              </td>

              <td>
                {plan.durationDays} días
              </td>

              <td className="table-number">
                S/ {Number(plan.price).toFixed(2)}
              </td>

              <td>
                <span
                  className={`status-badge ${
                    plan.active
                      ? 'status-active'
                      : 'status-inactive'
                  }`}
                >
                  {plan.active
                    ? 'Activo'
                    : 'Inactivo'}
                </span>
              </td>

              <td>
                <div className="table-actions">
                  <button
                    type="button"
                    className="table-action"
                    onClick={() => onEdit(plan)}
                    aria-label={`Editar el plan ${plan.name}`}
                  >
                    Editar
                  </button>

                  {plan.active && (
                    <button
                      type="button"
                      className="table-action danger"
                      onClick={() =>
                        onDeactivate(plan)
                      }
                      aria-label={`Desactivar el plan ${plan.name}`}
                    >
                      Desactivar
                    </button>
                  )}

                  {!plan.active && (
                    <button
                      type="button"
                      className="table-action"
                      onClick={() =>
                        onReactivate(plan)
                      }
                      aria-label={`Reactivar el plan ${plan.name}`}
                    >
                      Reactivar
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}