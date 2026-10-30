import type { Plan } from '../../types/plan';

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
      <div className="empty-state">
        No hay planes registrados.
      </div>
    );
  }

  return (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Duración</th>
            <th>Precio</th>
            <th>Estado</th>
            <th>Acciones</th>
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

              <td>
                S/ {Number(plan.price).toFixed(2)}
              </td>

              <td>
                <span
                  className={
                    plan.active
                      ? 'status active'
                      : 'status inactive'
                  }
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
                    onClick={() => onEdit(plan)}
                  >
                    Editar
                  </button>

                  {plan.active && (
                    <button
                      type="button"
                      onClick={() =>
                        onDeactivate(plan)
                      }
                    >
                      Desactivar
                    </button>
                  )}

                  {!plan.active && (
                    <button
                      type="button"
                      onClick={() =>
                        onReactivate(plan)
                      }
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