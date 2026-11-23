import { useCallback, useEffect, useState, type FormEvent } from 'react';

import {
  deleteMemberNote,
  getMemberActivity,
  getMemberNotes,
  createMemberNote,
  updateMemberNote,
} from '../../services/api';
import type {
  MemberActivity,
  MemberActivityType,
  MemberNote,
} from '../../types/crm';
import { formatDateTime } from '../../utils/date';
import { EmptyState } from '../ui/EmptyState';
import { LoadingState } from '../ui/LoadingState';
import { Modal } from '../ui/Modal';
import { useToast } from '../ui/ToastProvider';

const ACTIVITY_LABELS: Record<MemberActivityType, string> = {
  NOTE: 'Nota',
  ATTENDANCE: 'Ingreso',
  PAYMENT: 'Pago',
  MEMBERSHIP: 'Membresía',
  RESERVATION: 'Reserva',
};

interface MemberCrmPanelProps {
  memberId: string;
  memberName: string;
  onClose: () => void;
}

function errorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'Ocurrió un error inesperado.';
}

export function MemberCrmPanel({
  memberId,
  memberName,
  onClose,
}: MemberCrmPanelProps) {
  const { notify } = useToast();

  const [notes, setNotes] = useState<MemberNote[]>([]);
  const [activity, setActivity] = useState<MemberActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingBody, setEditingBody] = useState('');
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError('');

      const [nextNotes, nextActivity] = await Promise.all([
        getMemberNotes(memberId),
        getMemberActivity(memberId),
      ]);

      setNotes(nextNotes);
      setActivity(nextActivity);
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [memberId]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();

    if (!body.trim()) {
      return;
    }

    try {
      setSaving(true);
      setError('');

      await createMemberNote(memberId, body.trim());
      setBody('');
      await load();

      notify('Nota guardada.');
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (noteId: string) => {
    if (!editingBody.trim()) {
      return;
    }

    try {
      setSaving(true);
      setError('');

      await updateMemberNote(memberId, noteId, editingBody.trim());
      setEditingId(null);
      setEditingBody('');
      await load();

      notify('Nota actualizada.');
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (noteId: string) => {
    try {
      setSaving(true);
      setError('');

      await deleteMemberNote(memberId, noteId);
      setConfirmingId(null);
      await load();

      notify('Nota eliminada.');
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={`CRM · ${memberName}`}
      description="Notas internas e historial reciente del socio."
      onClose={onClose}
      className="crm-modal"
    >
      {error && (
        <div className="alert error" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <LoadingState label="Cargando historial..." />
      ) : (
        <div className="crm-layout">
          <section className="crm-column">
            <h3>Notas del equipo</h3>

            <form className="crm-note-form" onSubmit={handleCreate}>
              <label className="sr-only" htmlFor="crm-note-body">
                Nueva nota
              </label>

              <textarea
                id="crm-note-body"
                data-autofocus
                rows={3}
                maxLength={1000}
                placeholder="Registra una observación sobre el socio..."
                value={body}
                onChange={(event) => setBody(event.target.value)}
              />

              <button
                type="submit"
                className="button primary"
                disabled={saving || !body.trim()}
              >
                Agregar nota
              </button>
            </form>

            {notes.length === 0 ? (
              <EmptyState
                compact
                icon="📝"
                title="Sin notas"
                description="Registra la primera nota interna de este socio."
              />
            ) : (
              <ul className="crm-note-list">
                {notes.map((note) => (
                  <li key={note.id} className="crm-note">
                    <div className="crm-note-meta">
                      <strong>
                        {note.author.firstName}{' '}
                        {note.author.lastName}
                      </strong>
                      <span>{formatDateTime(note.createdAt)}</span>
                    </div>

                    {editingId === note.id ? (
                      <div className="crm-note-edit">
                        <textarea
                          aria-label="Editar nota"
                          rows={3}
                          maxLength={1000}
                          value={editingBody}
                          onChange={(event) =>
                            setEditingBody(event.target.value)
                          }
                        />

                        <div className="crm-note-actions">
                          <button
                            type="button"
                            className="button secondary"
                            onClick={() => setEditingId(null)}
                            disabled={saving}
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            className="button primary"
                            onClick={() => handleUpdate(note.id)}
                            disabled={saving || !editingBody.trim()}
                          >
                            Guardar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p>{note.body}</p>

                        <div className="crm-note-actions">
                          <button
                            type="button"
                            className="table-action"
                            onClick={() => {
                              setEditingId(note.id);
                              setEditingBody(note.body);
                              setConfirmingId(null);
                            }}
                          >
                            Editar
                          </button>

                          {confirmingId === note.id ? (
                            <>
                              <button
                                type="button"
                                className="table-action danger"
                                onClick={() => handleDelete(note.id)}
                                disabled={saving}
                              >
                                Confirmar
                              </button>
                              <button
                                type="button"
                                className="table-action"
                                onClick={() => setConfirmingId(null)}
                              >
                                Cancelar
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              className="table-action danger"
                              onClick={() => setConfirmingId(note.id)}
                            >
                              Eliminar
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="crm-column">
            <h3>Actividad reciente</h3>

            {activity.length === 0 ? (
              <EmptyState
                compact
                icon="🕒"
                title="Sin actividad"
                description="Todavía no hay registros para este socio."
              />
            ) : (
              <ol className="crm-timeline">
                {activity.map((item) => (
                  <li key={item.id}>
                    <span
                      className={`crm-timeline-type crm-activity-${item.type.toLowerCase()}`}
                    >
                      {ACTIVITY_LABELS[item.type]}
                    </span>

                    <div>
                      <strong>{item.title}</strong>
                      {item.description && <p>{item.description}</p>}
                      <time dateTime={item.date}>
                        {formatDateTime(item.date)}
                      </time>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>
      )}
    </Modal>
  );
}
