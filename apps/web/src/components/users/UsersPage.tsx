import { useCallback, useEffect, useMemo, useState } from 'react';

import { useAuth } from '../../auth/AuthProvider';
import {
  createUser,
  getMembers,
  getUsers,
  updateUser,
} from '../../services/api';
import type {
  CreateUserRequest,
  ManagedUser,
  UpdateUserRequest,
  UserRole,
} from '../../types/auth';
import type { Member } from '../../types/member';
import { matchesSearch } from '../../utils/search';

import { ActionDialog } from '../ui/ActionDialog';
import { EmptyState } from '../ui/EmptyState';
import { LoadingState } from '../ui/LoadingState';
import { SearchField } from '../ui/SearchField';
import { useToast } from '../ui/ToastProvider';
import { Modal } from '../ui/Modal';
import { UserForm, type UserFormValues } from './UserForm';

const roleLabels: Record<UserRole, string> = {
  ADMIN: 'Administrador',
  RECEPTION: 'Recepción',
  MEMBER: 'Socio',
};

const LAST_ACCESS_FORMATTER = new Intl.DateTimeFormat(
  'es-PE',
  {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  },
);

function formatLastAccess(value: string | null): string {
  if (!value) {
    return 'Nunca';
  }

  return LAST_ACCESS_FORMATTER.format(new Date(value));
}

export function UsersPage() {
  const { user: currentUser } = useAuth();
  const { notify } = useToast();

  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] =
    useState<ManagedUser | null>(null);
  const [pendingUser, setPendingUser] =
    useState<ManagedUser | null>(null);

  const loadUsers = useCallback(
    async (mode: 'initial' | 'refresh' = 'initial') => {
      try {
        if (mode === 'initial') {
          setLoading(true);
        }

        setError('');

        const data = await getUsers();

        setUsers(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'No se pudieron cargar los usuarios.',
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
    void loadUsers('initial');
  }, [loadUsers]);

  useEffect(() => {
    let active = true;

    const loadMembers = async () => {
      try {
        const data = await getMembers();

        if (active) {
          setMembers(data);
        }
      } catch {
        if (active) {
          setMembers([]);
        }
      } finally {
        if (active) {
          setMembersLoading(false);
        }
      }
    };

    void loadMembers();

    return () => {
      active = false;
    };
  }, []);

  const memberById = useMemo(
    () => new Map(members.map((member) => [member.id, member])),
    [members],
  );

  const filteredUsers = useMemo(
    () =>
      users.filter((user) => {
        const linkedMember = user.memberId
          ? memberById.get(user.memberId)
          : null;

        return matchesSearch(
          [
            user.firstName,
            user.lastName,
            user.email,
            roleLabels[user.role],
            linkedMember?.memberCode ?? '',
            linkedMember
              ? `${linkedMember.firstName} ${linkedMember.lastName}`
              : '',
          ],
          search,
        );
      }),
    [users, memberById, search],
  );

  const handleCreate = async (values: UserFormValues) => {
    const data: CreateUserRequest = {
      email: values.email,
      firstName: values.firstName,
      lastName: values.lastName,
      role: values.role,
      password: values.password,
      memberId: values.memberId,
    };

    await createUser(data);

    setShowForm(false);

    await loadUsers('refresh');

    notify('Usuario creado correctamente.');
  };

  const handleUpdate = async (values: UserFormValues) => {
    if (!editingUser) {
      return;
    }

    const data: UpdateUserRequest = {
      firstName: values.firstName,
      lastName: values.lastName,
      role: values.role,
      active: values.active,
      memberId: values.memberId,
    };

    if (values.password) {
      data.password = values.password;
    }

    await updateUser(editingUser.id, data);

    setEditingUser(null);

    await loadUsers('refresh');

    notify('Usuario actualizado correctamente.');
  };

  const handleToggleActive = async (user: ManagedUser) => {
    await updateUser(user.id, { active: !user.active });

    await loadUsers('refresh');

    notify(
      user.active
        ? `${user.firstName} ${user.lastName} fue desactivado.`
        : `${user.firstName} ${user.lastName} fue activado.`,
    );
  };

  if (loading) {
    return (
      <div className="page-container">
        <LoadingState label="Cargando usuarios..." />
      </div>
    );
  }

  return (
    <section>
      <div className="page-header">
        <div>
          <h1>Usuarios</h1>

          <p>
            Administra quién puede acceder a GymFlow y con qué rol.
          </p>
        </div>

        <button
          type="button"
          className="button primary"
          onClick={() => {
            setEditingUser(null);
            setShowForm(true);
          }}
        >
          Nuevo usuario
        </button>
      </div>

      {error && (
        <div className="alert error" role="alert">
          {error}
        </div>
      )}

      <div className="members-toolbar">
        <SearchField
          label="Buscar usuarios"
          placeholder="Buscar por nombre, correo o rol..."
          value={search}
          onChange={setSearch}
        />

        <div className="members-count" aria-live="polite">
          {filteredUsers.length} de {users.length} usuarios
        </div>
      </div>

      {(showForm || editingUser) && (
        <Modal
          title={
            editingUser ? 'Editar usuario' : 'Nuevo usuario'
          }
          description={
            editingUser
              ? 'Actualiza los datos, el rol o la contraseña.'
              : 'La persona podrá iniciar sesión con estas credenciales.'
          }
          onClose={() => {
            setShowForm(false);
            setEditingUser(null);
          }}
        >
          <UserForm
            user={editingUser}
            isSelf={editingUser?.id === currentUser?.id}
            members={members}
            membersLoading={membersLoading}
            onSubmit={
              editingUser ? handleUpdate : handleCreate
            }
            onCancel={() => {
              setShowForm(false);
              setEditingUser(null);
            }}
          />
        </Modal>
      )}

      {filteredUsers.length === 0 ? (
        <EmptyState
          icon="👥"
          title={
            users.length === 0
              ? 'No hay usuarios'
              : 'Sin resultados'
          }
          description={
            users.length === 0
              ? 'Crea el primer usuario para dar acceso al sistema.'
              : 'Ningún usuario coincide con la búsqueda.'
          }
        />
      ) : (
        <div className="table-container">
          <table className="members-table">
            <caption className="sr-only">
              Usuarios con acceso a GymFlow
            </caption>
            <thead>
              <tr>
                <th scope="col">Usuario</th>
                <th scope="col">Rol</th>
                <th scope="col">Estado</th>
                <th scope="col">Último acceso</th>
                <th scope="col">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td>
                    <strong>
                      {user.firstName} {user.lastName}
                    </strong>

                    <small>{user.email}</small>

                    {user.role === 'MEMBER' && user.memberId && (
                      <small className="user-member-ref">
                        Socio:{' '}
                        {memberById.get(user.memberId)?.memberCode ??
                          'Vinculado'}
                      </small>
                    )}
                  </td>

                  <td>
                    <span
                      className={`status-badge ${
                        user.role === 'ADMIN'
                          ? 'role-admin'
                          : user.role === 'MEMBER'
                            ? 'role-member'
                            : 'role-reception'
                      }`}
                    >
                      {roleLabels[user.role]}
                    </span>
                  </td>

                  <td>
                    <span
                      className={`status-badge ${
                        user.active
                          ? 'status-active'
                          : 'status-inactive'
                      }`}
                    >
                      {user.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>

                  <td>{formatLastAccess(user.lastLoginAt)}</td>

                  <td>
                    <div className="table-actions">
                      <button
                        type="button"
                        className="table-action"
                        onClick={() => {
                          setShowForm(false);
                          setEditingUser(user);
                        }}
                        aria-label={`Editar a ${user.firstName} ${user.lastName}`}
                      >
                        Editar
                      </button>

                      <button
                        type="button"
                        className="table-action danger"
                        disabled={user.id === currentUser?.id}
                        onClick={() =>
                          setPendingUser(user)
                        }
                        aria-label={`${
                          user.active ? 'Desactivar' : 'Activar'
                        } a ${user.firstName} ${user.lastName}`}
                      >
                        {user.active ? 'Desactivar' : 'Activar'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pendingUser && (
        <ActionDialog
          title={
            pendingUser.active
              ? 'Desactivar usuario'
              : 'Activar usuario'
          }
          description={
            <>
              <strong>
                {pendingUser.firstName}{' '}
                {pendingUser.lastName}
              </strong>
              {pendingUser.active
                ? ' no podrá iniciar sesión hasta que se reactive.'
                : ' podrá volver a iniciar sesión con su contraseña actual.'}
            </>
          }
          confirmLabel={
            pendingUser.active ? 'Desactivar' : 'Activar'
          }
          danger={pendingUser.active}
          onConfirm={() => handleToggleActive(pendingUser)}
          onClose={() => setPendingUser(null)}
        />
      )}
    </section>
  );
}
