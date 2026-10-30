import { useCallback, useEffect, useState } from 'react';

import { api } from '../../services/api';

import type {
  CreateMemberRequest,
  Member,
  MembersResponse,
} from '../../types/member';

import { MemberForm } from './MemberForm';
import { MemberTable } from './MemberTable';

export function MembersPage() {
  const [members, setMembers] = useState<Member[]>(
    [],
  );

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

  const loadMembers = useCallback(async () => {
    try {
      setLoading(true);
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
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

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

      await loadMembers();
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
    const confirmed = window.confirm(
      `¿Deseas desactivar a ${member.firstName} ${member.lastName}?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setError(null);

      await api.delete(
        `/members/${member.id}`,
      );

      await loadMembers();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'No se pudo desactivar el socio.',
      );
    }
  }

  function handleSearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  return (
    <section className="members-page">
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
          className="button primary"
          onClick={handleNewMember}
        >
          + Nuevo socio
        </button>
      </div>

      <div className="members-toolbar">
        <div className="search-box">
          <span>⌕</span>

          <input
            placeholder="Buscar por nombre o DNI..."
            value={search}
            onChange={(e) =>
              handleSearch(e.target.value)
            }
          />
        </div>

        <div className="members-count">
          {total} socios
        </div>
      </div>

      {error && (
        <div className="alert error">
          {error}
        </div>
      )}

      {loading ? (
        <div className="loading-state">
          Cargando socios...
        </div>
      ) : (
        <>
          <MemberTable
            members={members}
            onEdit={handleEdit}
            onDeactivate={handleDeactivate}
          />

          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="button secondary"
                disabled={page <= 1}
                onClick={() =>
                  setPage((current) => current - 1)
                }
              >
                Anterior
              </button>

              <span>
                Página {page} de {totalPages}
              </span>

              <button
                className="button secondary"
                disabled={page >= totalPages}
                onClick={() =>
                  setPage((current) => current + 1)
                }
              >
                Siguiente
              </button>
            </div>
          )}
        </>
      )}

      {showForm && (
        <MemberForm
          member={editingMember}
          loading={saving}
          onSubmit={handleSave}
          onCancel={() => {
            setShowForm(false);
            setEditingMember(null);
          }}
        />
      )}
    </section>
  );
}