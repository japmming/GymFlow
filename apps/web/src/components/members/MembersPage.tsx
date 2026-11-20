import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '../../auth/AuthProvider';
import { api, reactivateMember } from '../../services/api';

import type {
  CreateMemberRequest,
  Member,
  MembersResponse,
} from '../../types/member';
import type { MembersIntent } from '../../types/navigation';

import { ActionDialog } from '../ui/ActionDialog';
import { LoadingState } from '../ui/LoadingState';
import { Pagination } from '../ui/Pagination';
import { SearchField } from '../ui/SearchField';
import { useToast } from '../ui/ToastProvider';

import { MemberForm } from './MemberForm';
import { MemberTable } from './MemberTable';

type MemberAction = 'deactivate' | 'reactivate';

interface MembersPageProps {
  intent?: MembersIntent | null;
  onIntentHandled?: () => void;
}

export function MembersPage({
  intent,
  onIntentHandled,
}: MembersPageProps = {}) {
  const { isAdmin } = useAuth();
  const { notify } = useToast();

  const [members, setMembers] = useState<Member[]>(
    [],
  );

  const [searchInput, setSearchInput] = useState('');

  const [search, setSearch] = useState('');

  const [page, setPage] = useState(1);

  const [totalPages, setTotalPages] =
    useState(1);

  const [total, setTotal] = useState(0);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState<string | null>(
    null,
  );

  const [showForm, setShowForm] =
    useState(false);

  const [editingMember, setEditingMember] =
    useState<Member | null>(null);

  const [pendingAction, setPendingAction] = useState<{
    member: Member;
    action: MemberAction;
  } | null>(null);

  const loadMembers = useCallback(
    async (mode: 'initial' | 'refresh' = 'initial') => {
      try {
        if (mode === 'initial') {
          setLoading(true);
        }

        setError(null);

        const params = new URLSearchParams();

        if (search.trim()) {
          params.set('search', search.trim());
        }

        params.set('page', String(page));
        params.set('limit', '10');

        const response =
          await api.get<MembersResponse>(
            `/members?${params.toString()}`,
          );

        setMembers(response.data);
        setTotal(response.meta.total);
        setTotalPages(response.meta.totalPages);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : 'No se pudieron cargar los socios.',
        );
      } finally {
        if (mode === 'initial') {
          setLoading(false);
        }
      }
    },
    [search, page],
  );

  useEffect(() => {
    void loadMembers('initial');
  }, [loadMembers]);

  // Espera a que el usuario deje de escribir antes de buscar.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 250);

    return () => {
      window.clearTimeout(timer);
    };
  }, [searchInput]);

  // Aplica las acciones que llegan desde la barra superior.
  useEffect(() => {
    if (!intent) {
      return;
    }

    if (intent.mode === 'create') {
      setEditingMember(null);
      setShowForm(true);
    } else if (intent.term) {
      const term = intent.term.trim();

      setSearchInput(term);
      setSearch(term);
      setPage(1);
    }

    onIntentHandled?.();
  }, [intent, onIntentHandled]);

  function handleNewMember() {
    setEditingMember(null);
    setShowForm(true);
  }

  function handleEdit(member: Member) {
    setEditingMember(member);
    setShowForm(true);
  }

  async function handleSave(
    data: CreateMemberRequest,
  ) {
    try {
      setSaving(true);
      setError(null);

      if (editingMember) {
        await api.patch(
          `/members/${editingMember.id}`,
          data,
        );
      } else {
        await api.post('/members', data);
      }

      setShowForm(false);
      setEditingMember(null);

      await loadMembers('refresh');

      notify(
        editingMember
          ? 'Socio actualizado correctamente.'
          : 'Socio registrado correctamente.',
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'No se pudo guardar el socio.',
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate(
    member: Member,
  ) {
    await api.delete(`/members/${member.id}`);

    await loadMembers();

    notify(
      `${member.firstName} ${member.lastName} fue desactivado.`,
    );
  }

  function handleSearch(value: string) {
    setSearchInput(value);
  }

  async function handleReactivate(
    member: Member,
  ) {
    await reactivateMember(member.id);

    await loadMembers();

    notify(
      `${member.firstName} ${member.lastName} fue reactivado.`,
    );
  }

  return (
    <section className="page-container">
      <div className="page-header">
        <div>
          <span className="page-eyebrow">
            Gestión
          </span>

          <h1>Socios</h1>

          <p>
            Administra los socios registrados en
            GymFlow.
          </p>
        </div>

        <button
          type="button"
          className="button primary"
          onClick={handleNewMember}
        >
          <span aria-hidden="true">+</span> Nuevo socio
        </button>
      </div>

      <div className="members-toolbar">
        <SearchField
          label="Buscar socios"
          placeholder="Buscar por nombre, apellido, DNI o código..."
          value={searchInput}
          onChange={handleSearch}
        />

        <div className="members-count" aria-live="polite">
          {total} {total === 1 ? 'socio' : 'socios'}
        </div>
      </div>

      {error && (
        <div className="alert error" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <LoadingState label="Cargando socios..." />
      ) : (
        <>
          <MemberTable
            members={members}
            canManage={isAdmin}
            onEdit={handleEdit}
            onDeactivate={(member) =>
              setPendingAction({
                member,
                action: 'deactivate',
              })
            }
            onReactivate={(member) =>
              setPendingAction({
                member,
                action: 'reactivate',
              })
            }
          />

          <Pagination
            page={page}
            totalPages={totalPages}
            totalItems={total}
            pageSize={10}
            onPageChange={setPage}
          />
        </>
      )}

      {showForm && (
        <MemberForm
          member={editingMember}
          loading={saving}
          error={error}
          onSubmit={handleSave}
          onCancel={() => {
            setShowForm(false);
            setEditingMember(null);
          }}
        />
      )}

      {pendingAction && (
        <ActionDialog
          title={
            pendingAction.action === 'deactivate'
              ? 'Desactivar socio'
              : 'Reactivar socio'
          }
          description={
            <>
              <strong>
                {pendingAction.member.firstName}{' '}
                {pendingAction.member.lastName}
              </strong>
              {pendingAction.action === 'deactivate'
                ? ' dejará de poder registrar asistencias hasta que se reactive.'
                : ' volverá a estar disponible para registrar asistencias.'}
            </>
          }
          confirmLabel={
            pendingAction.action === 'deactivate'
              ? 'Desactivar'
              : 'Reactivar'
          }
          danger={pendingAction.action === 'deactivate'}
          onConfirm={() =>
            pendingAction.action === 'deactivate'
              ? handleDeactivate(pendingAction.member)
              : handleReactivate(pendingAction.member)
          }
          onClose={() => setPendingAction(null)}
        />
      )}
    </section>
  );
}