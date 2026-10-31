import { useEffect, useMemo, useState } from 'react';

import { useAuth } from '../../auth/AuthProvider';
import {
  createUser,
  getUsers,
  updateUser,
} from '../../services/api';
import type {
  CreateUserRequest,
  ManagedUser,
  UpdateUserRequest,
} from '../../types/auth';
import { matchesSearch } from '../../utils/search';

import { UserForm, type UserFormValues } from './UserForm';

const roleLabels: Record<string, string> = {
  ADMIN: 'Administrador',
  RECEPTION: 'Recepción',
};

function formatLastAccess(value: string | null): string {
  if (!value) {
    return 'Nunca';
  }

  return new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export function UsersPage() {
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] =
    useState<ManagedUser | null>(null);

  const loadUsers = async () => {
    try {
      setLoading(true);
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
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadUsers();
  }, []);

  const filteredUsers = useMemo(
    () =>
      users.filter((user) =>
        matchesSearch(
          [
            user.firstName,
            user.lastName,
            user.email,
            roleLabels[user.role],
          ],
          search,
        ),
      ),
    [users, search],
  );

  const handleCreate = async (values: UserFormValues) => {
    const data: CreateUserRequest = {
      email: values.email,
      firstName: values.firstName,
      lastName: values.lastName,
      role: values.role,
      password: values.password,
    };

    await createUser(data);

    setShowForm(false);

    await loadUsers();
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
    };

    if (values.password) {
      data.password = values.password;
    }

    await updateUser(editingUser.id, data);

    setEditingUser(null);

    await loadUsers();
  };

  const handleToggleActive = async (user: ManagedUser) => {
    const action = user.active ? 'desactivar' : 'activar';
    const confirmed = window.confirm(
      `¿Deseas ${action} a ${user.firstName} ${user.lastName}?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setError('');

      await updateUser(user.id, { active: !user.active });

      await loadUsers();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudo actualizar el usuario.',
      );
    }
  };

  if (loading) {
    return <div className="loading-state">Cargando usuarios...</div>;
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

      {error && <div className="alert error">{error}</div>}

      <div className="members-toolbar">
        <div className="search-box">
          <span>⌕</span>

          <input
            placeholder="Buscar por nombre, correo o rol..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div className="members-count">
          {filteredUsers.length} de {users.length} usuarios
        </div>
      </div>

      {(showForm || editingUser) && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <div>
                <h2>
                  {editingUser ? 'Editar usuario' : 'Nuevo usuario'}
                </h2>

                <p>
                  {editingUser
                    ? 'Actualiza los datos, el rol o la contraseña.'
                    : 'La persona podrá iniciar sesión con estas credenciales.'}
                </p>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={() => {
                  setShowForm(false);
                  setEditingUser(null);
                }}
                aria-label="Cerrar"
              >
                ×
              </button>
            </div>

            <UserForm
              user={editingUser}
              isSelf={editingUser?.id === currentUser?.id}
              onSubmit={
                editingUser ? handleUpdate : handleCreate
              }
              onCancel={() => {
                setShowForm(false);
                setEditingUser(null);
              }}
            />
          </div>
        </div>
      )}

      {filteredUsers.length === 0 ? (
        <div className="empty-state">
          No hay usuarios que coincidan con la búsqueda.
        </div>
      ) : (
        <div className="table-container">
          <table className="members-table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Último acceso</th>
                <th>Acciones</th>
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
                  </td>

                  <td>
                    <span
                      className={`status-badge ${
                        user.role === 'ADMIN'
                          ? 'status-scheduled'
                          : 'status-inactive'
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
                          : 'status-cancelled'
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
                      >
                        Editar
                      </button>

                      <button
                        type="button"
                        className="table-action danger"
                        disabled={user.id === currentUser?.id}
                        onClick={() => handleToggleActive(user)}
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
    </section>
  );
}
