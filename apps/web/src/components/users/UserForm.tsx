import { useEffect, useState, type FormEvent } from 'react';

import type { Member } from '../../types/member';
import type {
  ManagedUser,
  UserRole,
} from '../../types/auth';

export interface UserFormValues {
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  active: boolean;
  password: string;
  memberId: string | null;
}

interface UserFormProps {
  user?: ManagedUser | null;
  isSelf?: boolean;
  members: Member[];
  membersLoading?: boolean;
  onSubmit: (values: UserFormValues) => Promise<void>;
  onCancel: () => void;
}

function memberLabel(member: Member): string {
  const name = `${member.firstName} ${member.lastName}`.trim();
  const email = member.email ? ` · ${member.email}` : '';

  return `${member.memberCode} · ${name}${email}`;
}

export function UserForm({
  user,
  isSelf = false,
  members,
  membersLoading = false,
  onSubmit,
  onCancel,
}: UserFormProps) {
  const editing = Boolean(user);

  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState<UserRole>('RECEPTION');
  const [memberId, setMemberId] = useState('');
  const [active, setActive] = useState(true);
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setEmail(user.email);
      setFirstName(user.firstName);
      setLastName(user.lastName);
      setRole(user.role);
      setMemberId(user.memberId ?? '');
      setActive(user.active);
      setPassword('');
      return;
    }

    setEmail('');
    setFirstName('');
    setLastName('');
    setRole('RECEPTION');
    setMemberId('');
    setActive(true);
    setPassword('');
  }, [user]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (password && password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    if (firstName.trim().length < 2) {
      setError('El nombre debe tener al menos 2 caracteres.');
      return;
    }

    if (lastName.trim().length < 2) {
      setError('El apellido debe tener al menos 2 caracteres.');
      return;
    }

    if (role === 'MEMBER' && !memberId) {
      setError('Selecciona el socio vinculado a este usuario.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      await onSubmit({
        email: email.trim().toLowerCase(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        role,
        active,
        password,
        memberId: role === 'MEMBER' ? memberId : null,
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudo guardar el usuario.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="member-form" onSubmit={handleSubmit}>
      {error && (
        <div
          id="user-form-error"
          className="alert error"
          role="alert"
        >
          {error}
        </div>
      )}

      <div className="form-grid">
        <label className="form-full">
          Correo electrónico
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            disabled={editing}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="usuario@gimnasio.com"
          />
        </label>

        <label>
          Nombre
          <input
            name="firstName"
            type="text"
            autoComplete="given-name"
            required
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
          />
        </label>

        <label>
          Apellido
          <input
            name="lastName"
            type="text"
            autoComplete="family-name"
            required
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
          />
        </label>

        <label>
          Rol
          <select
            name="role"
            value={role}
            disabled={isSelf}
            onChange={(event) =>
              setRole(event.target.value as UserRole)
            }
          >
            <option value="ADMIN">Administrador</option>
            <option value="RECEPTION">Recepción</option>
            <option value="MEMBER">Socio</option>
          </select>
        </label>

        {role === 'MEMBER' && (
          <label className="form-full">
            Socio vinculado
            <select
              name="memberId"
              required
              value={memberId}
              disabled={membersLoading}
              onChange={(event) =>
                setMemberId(event.target.value)
              }
            >
              <option value="">
                {membersLoading
                  ? 'Cargando socios...'
                  : 'Selecciona un socio'}
              </option>

              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {memberLabel(member)}
                </option>
              ))}
            </select>

            {members.length === 0 && !membersLoading && (
              <span className="field-hint">
                No hay socios registrados. Crea un socio antes de
                asignar este rol.
              </span>
            )}
          </label>
        )}

        <label>
          {editing ? 'Nueva contraseña' : 'Contraseña'}
          <input
            name="password"
            type="password"
            required={!editing}
            minLength={password ? 8 : undefined}
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder={
              editing
                ? 'Dejar vacío para no cambiarla'
                : 'Mínimo 8 caracteres'
            }
          />
        </label>

        {editing && (
          <label className="form-full checkbox-field">
            <input
              name="active"
              type="checkbox"
              checked={active}
              disabled={isSelf}
              onChange={(event) =>
                setActive(event.target.checked)
              }
            />
            Usuario activo (puede iniciar sesión)
            {isSelf && ' — no puedes desactivar tu propia cuenta'}
          </label>
        )}
      </div>

      <div className="modal-footer">
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
          disabled={loading || (role === 'MEMBER' && membersLoading)}
          aria-describedby={
            error ? 'user-form-error' : undefined
          }
        >
          {loading
            ? 'Guardando...'
            : editing
              ? 'Guardar cambios'
              : 'Crear usuario'}
        </button>
      </div>
    </form>
  );
}
