import { useEffect, useState } from 'react';

import type {
  CreateMemberRequest,
  Member,
} from '../../types/member';

import { Modal } from '../ui/Modal';

interface MemberFormProps {
  member?: Member | null;
  loading?: boolean;
  error?: string | null;
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
  error,
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
    <Modal
      title={isEditing ? 'Editar socio' : 'Nuevo socio'}
      description="Registra la información básica del socio."
      onClose={onCancel}
    >
      <form
        className="member-form"
        onSubmit={handleSubmit}
      >
        <div className="form-grid">
          <label>
            Nombres
            <input
              name="firstName"
              autoComplete="given-name"
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
              name="lastName"
              autoComplete="family-name"
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
              name="documentNumber"
              inputMode="numeric"
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
              name="memberCode"
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
              name="phone"
              type="tel"
              autoComplete="tel"
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
              name="email"
              type="email"
              autoComplete="email"
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

        {error && (
          <div
            id="member-form-error"
            className="error-message"
            role="alert"
          >
            {error}
          </div>
        )}

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
    </Modal>
  );
}