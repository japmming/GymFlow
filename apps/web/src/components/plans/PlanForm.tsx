import { useState } from 'react';
import type { CreatePlanRequest } from '../../types/plan';

interface PlanFormProps {
  onSubmit: (data: CreatePlanRequest) => Promise<void>;
  onCancel: () => void;
}

export function PlanForm({
  onSubmit,
  onCancel,
}: PlanFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [durationDays, setDurationDays] = useState('30');
  const [price, setPrice] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
        description: description.trim() || undefined,
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
        <label>Nombre</label>

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej. Mensual"
        />
      </div>

      <div className="form-group">
        <label>Descripción</label>

        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descripción del plan"
          rows={3}
        />
      </div>

      <div className="form-group">
        <label>Duración (días)</label>

        <input
          type="number"
          min="1"
          value={durationDays}
          onChange={(e) => setDurationDays(e.target.value)}
        />
      </div>

      <div className="form-group">
        <label>Precio</label>

        <input
          type="number"
          min="0"
          step="0.01"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="80.00"
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
          {loading ? 'Guardando...' : 'Guardar plan'}
        </button>
      </div>
    </form>
  );
}