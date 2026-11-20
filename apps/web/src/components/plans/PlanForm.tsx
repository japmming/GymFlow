import { useEffect, useState } from 'react';
import type {
  CreatePlanRequest,
  Plan,
} from '../../types/plan';

interface PlanFormProps {
  plan?: Plan | null;
  onSubmit: (data: CreatePlanRequest) => Promise<void>;
  onCancel: () => void;
}

export function PlanForm({
  plan,
  onSubmit,
  onCancel,
}: PlanFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [durationDays, setDurationDays] = useState('30');
  const [price, setPrice] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (plan) {
      setName(plan.name);
      setDescription(plan.description ?? '');
      setDurationDays(String(plan.durationDays));
      setPrice(String(plan.price));
      return;
    }

    setName('');
    setDescription('');
    setDurationDays('30');
    setPrice('');
  }, [plan]);

  const handleSubmit = async (
    event: React.FormEvent,
  ) => {
    event.preventDefault();

    setError('');

    if (!name.trim()) {
      setError('El nombre del plan es obligatorio.');
      return;
    }

    const duration = Number(durationDays);
    const planPrice = Number(price);

    if (!Number.isInteger(duration) || duration <= 0) {
      setError('La duración debe ser un número mayor a 0.');
      return;
    }

    if (!Number.isFinite(planPrice) || planPrice < 0) {
      setError('El precio no es válido.');
      return;
    }

    try {
      setLoading(true);

      await onSubmit({
        name: name.trim(),
        description: description.trim() || null,
        durationDays: duration,
        price: planPrice,
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudo crear el plan.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form">
      <div className="form-group">
        <label htmlFor="plan-name">Nombre</label>

        <input
          id="plan-name"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej. Mensual"
        />
      </div>

      <div className="form-group">
        <label htmlFor="plan-description">
          Descripción
        </label>

        <textarea
          id="plan-description"
          name="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descripción del plan"
          rows={3}
        />
      </div>

      <div className="form-group">
        <label htmlFor="plan-duration">
          Duración (días)
        </label>

        <input
          id="plan-duration"
          name="durationDays"
          type="number"
          inputMode="numeric"
          min="1"
          value={durationDays}
          onChange={(e) => setDurationDays(e.target.value)}
        />
      </div>

      <div className="form-group">
        <label htmlFor="plan-price">Precio</label>

        <input
          id="plan-price"
          name="price"
          type="number"
          inputMode="decimal"
          min="0"
          step="0.01"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="80.00"
        />
      </div>

      {error && (
        <div
          id="plan-form-error"
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
          disabled={loading}
          aria-describedby={
            error ? 'plan-form-error' : undefined
          }
        >
          {loading ? 'Guardando...' : 'Guardar plan'}
        </button>
      </div>
    </form>
  );
}