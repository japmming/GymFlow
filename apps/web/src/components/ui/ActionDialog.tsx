import { useState, type FormEvent, type ReactNode } from 'react';

import { Modal } from './Modal';

interface ReasonConfig {
  label: string;
  placeholder?: string;
  helpText?: string;
  required?: boolean;
  maxLength?: number;
}

interface ActionDialogProps {
  title: string;
  description?: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  danger?: boolean;
  reason?: ReasonConfig;
  onConfirm: (reason: string) => Promise<void> | void;
  onClose: () => void;
}

/**
 * Diálogo de confirmación reutilizable. Sustituye a
 * window.confirm/window.prompt manteniendo el foco, el teclado y
 * el estado de carga dentro de la interfaz.
 */
export function ActionDialog({
  title,
  description,
  confirmLabel,
  cancelLabel = 'Cancelar',
  danger = false,
  reason,
  onConfirm,
  onClose,
}: ActionDialogProps) {
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    const trimmed = value.trim();

    if (reason?.required && !trimmed) {
      setError('Escribe un motivo para continuar.');

      return;
    }

    try {
      setBusy(true);
      setError('');

      await onConfirm(trimmed);

      onClose();
    } catch (err) {
      setError(
        err instanceof Error && err.message
          ? err.message
          : 'No se pudo completar la acción.',
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      title={title}
      description={description}
      className="action-dialog"
      onClose={busy ? () => undefined : onClose}
    >
      <form className="form dialog-form" onSubmit={handleSubmit}>
        {reason && (
          <label className="dialog-reason">
            <span>{reason.label}</span>

            <textarea
              data-autofocus
              name="reason"
              rows={3}
              maxLength={reason.maxLength ?? 240}
              placeholder={reason.placeholder}
              value={value}
              onChange={(event) => {
                setValue(event.target.value);

                if (error) {
                  setError('');
                }
              }}
              disabled={busy}
              aria-required={reason.required || undefined}
            />

            {reason.helpText && (
              <small>{reason.helpText}</small>
            )}
          </label>
        )}

        {error && (
          <div className="dialog-error" role="alert">
            {error}
          </div>
        )}

        <div className="form-actions">
          <button
            type="button"
            className="button secondary"
            onClick={onClose}
            disabled={busy}
            data-autofocus={reason ? undefined : true}
          >
            {cancelLabel}
          </button>

          <button
            type="submit"
            className={
              danger ? 'button danger-solid' : 'button primary'
            }
            disabled={busy}
          >
            {busy ? 'Procesando...' : confirmLabel}
          </button>
        </div>
      </form>
    </Modal>
  );
}
