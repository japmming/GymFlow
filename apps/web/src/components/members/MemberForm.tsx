import { useEffect, useState } from 'react';

import type {
  CreateMemberRequest,
  Member,
} from '../../types/member';

interface MemberFormProps {
  member?: Member | null;
  loading?: boolean;
  onSubmit: (
    data: CreateMemberRequest,
  ) => Promise<void>;
  onCancel: () => void;
}

interface FormState {
  firstName: string;
  lastName: string;
  documentNumber: string;
  memberCode: string;
  phone: string;
  email: string;
}

const emptyForm: FormState = {
  firstName: '',
  lastName: '',
  documentNumber: '',
  memberCode: '',
  phone: '',
  email: '',
};

export function MemberForm({
  member,
  loading = false,
  onSubmit,
  onCancel,
}: MemberFormProps) {
  const [form, setForm] =
    useState<FormState>(emptyForm);

  useEffect(() => {
    if (member) {
      setForm({
        firstName: member.firstName,
        lastName: member.lastName,
        documentNumber:
          member.documentNumber ?? '',
        memberCode: member.memberCode ?? '',
        phone: member.phone ?? '',
        email: member.email ?? '',
      });
    } else {
      setForm(emptyForm);
    }
  }, [member]);

  function handleChange(
    field: keyof FormState,
    value: string,
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(
    event: React.FormEvent,
  ) {
    event.preventDefault();

    await onSubmit({
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      documentNumber:
        form.documentNumber.trim() || null,
      memberCode:
        form.memberCode.trim() || undefined,
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
    });
  }

  const isEditing = Boolean(member);

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <div className="modal-header">
          <div>
            <h2>
              {isEditing
                ? 'Editar socio'
                : 'Nuevo socio'}
            </h2>

            <p>
              Registra la información básica del socio.
            </p>
          </div>

          <button
            className="modal-close"
            onClick={onCancel}
            type="button"
          >
            ×
          </button>
        </div>

        <form
          className="member-form"
          onSubmit={handleSubmit}
        >
          <div className="form-grid">
            <label>
              Nombres
              <input
                value={form.firstName}
                onChange={(e) =>
                  handleChange(
                    'firstName',
                    e.target.value,
                  )
                }
                required
                minLength={2}
              />
            </label>

            <label>
              Apellidos
              <input
                value={form.lastName}
                onChange={(e) =>
                  handleChange(
                    'lastName',
                    e.target.value,
                  )
                }
                required
                minLength={2}
              />
            </label>

            <label>
              DNI
              <input
                value={form.documentNumber}
                onChange={(e) =>
                  handleChange(
                    'documentNumber',
                    e.target.value,
                  )
                }
                maxLength={30}
              />
            </label>

            <label>
              Código de socio
              <input
                value={form.memberCode}
                onChange={(e) =>
                  handleChange(
                    'memberCode',
                    e.target.value,
                  )
                }
                maxLength={30}
                placeholder={
                  isEditing
                    ? ''
                    : 'Se genera automáticamente'
                }
                autoComplete="off"
              />
            </label>

            <label>
              Teléfono
              <input
                value={form.phone}
                onChange={(e) =>
                  handleChange(
                    'phone',
                    e.target.value,
                  )
                }
                maxLength={30}
              />
            </label>

            <label className="form-full">
              Correo electrónico
              <input
                type="email"
                value={form.email}
                onChange={(e) =>
                  handleChange(
                    'email',
                    e.target.value,
                  )
                }
                maxLength={150}
              />
            </label>
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
              disabled={loading}
            >
              {loading
                ? 'Guardando...'
                : isEditing
                  ? 'Guardar cambios'
                  : 'Registrar socio'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}