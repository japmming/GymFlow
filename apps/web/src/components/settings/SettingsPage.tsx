import {
  Building2,
  Check,
  Clock3,
  Globe2,
  Image as ImageIcon,
  RefreshCw,
  Save,
} from 'lucide-react';

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type RefObject,
} from 'react';

import {
  getGymSettings,
  updateGymSettings,
} from '../../services/api';
import {
  OPENING_DAYS,
  type GymSettings,
  type OpeningDay,
  type OpeningDayKey,
  type OpeningHours,
  type OpeningInterval,
  type UpdateGymRequest,
} from '../../types/gym';
import { LoadingState } from '../ui/LoadingState';
import { useToast } from '../ui/ToastProvider';

interface SettingsForm {
  name: string;
  slug: string;
  timezone: string;
  currency: string;
  logoUrl: string;
  openingHours: OpeningHours;
}

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const CURRENCY_PATTERN = /^[A-Z]{3}$/;
const DEFAULT_INTERVAL: OpeningInterval = {
  start: '09:00',
  end: '18:00',
};

function defaultOpeningHours(): OpeningHours {
  return OPENING_DAYS.reduce((hours, { key }) => {
    hours[key] = {
      closed: key === 'sunday',
      interval:
        key === 'saturday'
          ? { start: '09:00', end: '13:00' }
          : { ...DEFAULT_INTERVAL },
    };

    return hours;
  }, {} as OpeningHours);
}

function toForm(settings: GymSettings): SettingsForm {
  return {
    name: settings.name,
    slug: settings.slug,
    timezone: settings.timezone,
    currency: settings.currency,
    logoUrl: settings.logoUrl ?? '',
    openingHours: settings.openingHours ?? defaultOpeningHours(),
  };
}

function validateForm(form: SettingsForm): string {
  if (form.name.trim().length < 2) {
    return 'El nombre del gimnasio debe tener al menos 2 caracteres.';
  }

  if (!SLUG_PATTERN.test(form.slug.trim().toLowerCase())) {
    return 'El slug solo puede contener letras minúsculas, números y guiones.';
  }

  try {
    new Intl.DateTimeFormat('es-PE', {
      timeZone: form.timezone.trim(),
    });
  } catch {
    return 'La zona horaria no es válida.';
  }

  if (!CURRENCY_PATTERN.test(form.currency.trim().toUpperCase())) {
    return 'La moneda debe ser un código ISO de 3 letras.';
  }

  const logo = form.logoUrl.trim();

  if (logo) {
    try {
      const url = new URL(logo);

      if (!['http:', 'https:'].includes(url.protocol)) {
        return 'El logo debe usar una URL http o https.';
      }
    } catch {
      return 'Ingresa una URL válida para el logo o deja el campo vacío.';
    }
  }

  for (const { key, label } of OPENING_DAYS) {
    const day = form.openingHours[key];

    if (day.closed) {
      continue;
    }

    const { start, end } = day.interval;

    if (!TIME_PATTERN.test(start) || !TIME_PATTERN.test(end)) {
      return `Revisa el horario del ${label.toLowerCase()}.`;
    }

    if (start >= end) {
      return `El cierre del ${label.toLowerCase()} debe ser posterior a la apertura.`;
    }
  }

  return '';
}

function toRequest(form: SettingsForm): UpdateGymRequest {
  const logo = form.logoUrl.trim();
  const openingHours = OPENING_DAYS.reduce((hours, { key }) => {
    const day = form.openingHours[key];

    hours[key] = day.closed
      ? { closed: true, interval: { ...DEFAULT_INTERVAL } }
      : {
          closed: false,
          interval: {
            start: day.interval.start.trim(),
            end: day.interval.end.trim(),
          },
        };

    return hours;
  }, {} as OpeningHours);

  return {
    name: form.name.trim(),
    slug: form.slug.trim().toLowerCase(),
    timezone: form.timezone.trim(),
    currency: form.currency.trim().toUpperCase(),
    logoUrl: logo || null,
    openingHours,
  };
}

function LogoPreview({ name, url }: { name: string; url: string }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [url]);

  const trimmed = url.trim();

  if (trimmed && !failed) {
    return (
      <img
        className="settings-logo-image"
        src={trimmed}
        alt="Vista previa del logo"
        onError={() => setFailed(true)}
      />
    );
  }

  const initials =
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((word) => word.charAt(0).toUpperCase())
      .join('') || 'GF';

  return (
    <span className="settings-logo-fallback" aria-hidden="true">
      {initials}
    </span>
  );
}

export function SettingsPage() {
  const { notify } = useToast();

  const identityRef = useRef<HTMLElement | null>(null);
  const localeRef = useRef<HTMLElement | null>(null);
  const brandRef = useRef<HTMLElement | null>(null);
  const hoursRef = useRef<HTMLElement | null>(null);

  const [settings, setSettings] = useState<GymSettings | null>(null);
  const [form, setForm] = useState<SettingsForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadSettings() {
      try {
        const data = await getGymSettings();

        if (!active) {
          return;
        }

        setSettings(data);
        setForm(toForm(data));
      } catch (caught) {
        if (active) {
          setError(
            caught instanceof Error
              ? caught.message
              : 'No se pudo cargar la configuración.',
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadSettings();

    return () => {
      active = false;
    };
  }, []);

  const baseline = settings ? toForm(settings) : null;
  const isDirty = baseline && form
    ? JSON.stringify(baseline) !== JSON.stringify(form)
    : false;

  const steps = settings
    ? [
        {
          label: 'Identidad del gimnasio',
          detail: 'Nombre y dirección única del gimnasio.',
          done: Boolean(settings.name.trim() && settings.slug.trim()),
          target: identityRef,
          icon: Building2,
        },
        {
          label: 'Zona horaria y moneda',
          detail: 'Base para reportes, vencimientos e importes.',
          done: Boolean(
            settings.timezone.trim() &&
              CURRENCY_PATTERN.test(settings.currency),
          ),
          target: localeRef,
          icon: Globe2,
        },
        {
          label: 'Logo del gimnasio',
          detail: 'Identidad visual en la experiencia de gestión.',
          done: Boolean(settings.logoUrl),
          target: brandRef,
          icon: ImageIcon,
        },
        {
          label: 'Horarios de atención',
          detail: 'Referencia para planificar clases y eventos.',
          done: Boolean(settings.openingHours),
          target: hoursRef,
          icon: Clock3,
        },
      ]
    : [];

  const completedSteps = steps.filter((step) => step.done).length;

  function focusStep(target: RefObject<HTMLElement | null>) {
    target.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
    target.current
      ?.querySelector<HTMLElement>('input, select, button')
      ?.focus();
  }

  function updateOpening(
    key: OpeningDayKey,
    updater: (day: OpeningDay) => OpeningDay,
  ) {
    setForm((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        openingHours: {
          ...current.openingHours,
          [key]: updater(current.openingHours[key]),
        },
      };
    });
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!form) {
      return;
    }

    const validationError = validateForm(form);

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSaving(true);
      setError('');

      const updated = await updateGymSettings(toRequest(form));

      setSettings(updated);
      setForm(toForm(updated));
      notify('Configuración del gimnasio guardada correctamente.');
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'No se pudo guardar la configuración.',
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <LoadingState label="Cargando configuración..." />
      </div>
    );
  }

  if (!settings || !form) {
    return (
      <div className="page-container">
        <div className="page-header">
          <div>
            <span className="page-eyebrow">Sistema</span>
            <h1>Configuración</h1>
            <p>
              No se pudo cargar la configuración del gimnasio.
            </p>
          </div>
        </div>

        {error && (
          <div className="alert error" role="alert">
            {error}
          </div>
        )}

        <button
          type="button"
          className="button secondary"
          onClick={() => {
            setLoading(true);
            setError('');
            window.location.reload();
          }}
        >
          <RefreshCw size={15} aria-hidden="true" />
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <span className="page-eyebrow">Sistema</span>
          <h1>Configuración del gimnasio</h1>
          <p>
            Define la identidad, la moneda, la zona horaria y los
            horarios que usa GymFlow en el resto del sistema.
          </p>
        </div>
      </div>

      {error && (
        <div className="alert error" role="alert">
          {error}
        </div>
      )}

      <div className="settings-layout">
        <form className="settings-stack" onSubmit={handleSubmit}>
          <section className="settings-panel" ref={identityRef}>
            <header className="settings-panel-head">
              <h2>Identidad</h2>
              <p>
                El nombre se muestra en el sistema y el slug identifica
                al gimnasio de forma única.
              </p>
            </header>

            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="gym-name">Nombre del gimnasio</label>
                <input
                  id="gym-name"
                  type="text"
                  required
                  minLength={2}
                  maxLength={150}
                  value={form.name}
                  onChange={(event) =>
                    setForm({ ...form, name: event.target.value })
                  }
                />
              </div>

              <div className="form-group">
                <label htmlFor="gym-slug">Identificador (slug)</label>
                <input
                  id="gym-slug"
                  type="text"
                  required
                  maxLength={80}
                  value={form.slug}
                  onChange={(event) =>
                    setForm({ ...form, slug: event.target.value })
                  }
                />
              </div>
            </div>

            <p className="settings-hint">
              Usa letras minúsculas, números y guiones. Ejemplo:
              gymflow-demo.
            </p>
          </section>

          <section className="settings-panel" ref={localeRef}>
            <header className="settings-panel-head">
              <h2>Zona horaria y moneda</h2>
              <p>
                Estos valores se aplican a reportes, vencimientos e
                importes de membresías y eventos.
              </p>
            </header>

            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="gym-timezone">Zona horaria</label>
                <input
                  id="gym-timezone"
                  type="text"
                  list="gym-timezones"
                  required
                  maxLength={64}
                  value={form.timezone}
                  onChange={(event) =>
                    setForm({ ...form, timezone: event.target.value })
                  }
                />
                <datalist id="gym-timezones">
                  <option value="America/Lima" />
                  <option value="America/Bogota" />
                  <option value="America/Mexico_City" />
                  <option value="America/Buenos_Aires" />
                  <option value="America/Santiago" />
                  <option value="Europe/Madrid" />
                  <option value="UTC" />
                </datalist>
              </div>

              <div className="form-group">
                <label htmlFor="gym-currency">Moneda</label>
                <input
                  id="gym-currency"
                  type="text"
                  list="gym-currencies"
                  required
                  maxLength={3}
                  value={form.currency}
                  onChange={(event) =>
                    setForm({ ...form, currency: event.target.value })
                  }
                />
                <datalist id="gym-currencies">
                  <option value="PEN" />
                  <option value="USD" />
                  <option value="EUR" />
                  <option value="COP" />
                  <option value="CLP" />
                  <option value="ARS" />
                  <option value="MXN" />
                </datalist>
              </div>
            </div>
          </section>

          <section className="settings-panel" ref={brandRef}>
            <header className="settings-panel-head">
              <h2>Logo</h2>
              <p>
                Opcional. Usa una imagen pública accesible por HTTPS.
              </p>
            </header>

            <div className="settings-logo-row">
              <LogoPreview name={form.name} url={form.logoUrl} />

              <div className="form-group settings-logo-field">
                <label htmlFor="gym-logo">URL del logo</label>
                <input
                  id="gym-logo"
                  type="url"
                  value={form.logoUrl}
                  placeholder="https://ejemplo.com/logo.png"
                  onChange={(event) =>
                    setForm({ ...form, logoUrl: event.target.value })
                  }
                />
                <p className="settings-hint">
                  Deja el campo vacío para usar las iniciales del
                  gimnasio.
                </p>
              </div>
            </div>
          </section>

          <section className="settings-panel" ref={hoursRef}>
            <header className="settings-panel-head">
              <h2>Horarios de atención</h2>
              <p>
                Define una franja por día. Marca «Cerrado» cuando no
                haya atención; esos horarios no se usan en los reportes.
              </p>
            </header>

            <div className="settings-hours">
              {OPENING_DAYS.map(({ key, label }) => {
                const day = form.openingHours[key];

                return (
                  <div
                    className={
                      day.closed
                        ? 'settings-hour-row is-closed'
                        : 'settings-hour-row'
                    }
                    key={key}
                  >
                    <strong>{label}</strong>

                    <label className="settings-check">
                      <input
                        type="checkbox"
                        checked={day.closed}
                        onChange={(event) =>
                          updateOpening(key, (current) => ({
                            ...current,
                            closed: event.target.checked,
                          }))
                        }
                      />
                      Cerrado
                    </label>

                    <input
                      type="time"
                      aria-label={`Apertura del ${label.toLowerCase()}`}
                      disabled={day.closed}
                      value={day.interval.start}
                      onChange={(event) =>
                        updateOpening(key, (current) => ({
                          ...current,
                          interval: {
                            ...current.interval,
                            start: event.target.value,
                          },
                        }))
                      }
                    />

                    <input
                      type="time"
                      aria-label={`Cierre del ${label.toLowerCase()}`}
                      disabled={day.closed}
                      value={day.interval.end}
                      onChange={(event) =>
                        updateOpening(key, (current) => ({
                          ...current,
                          interval: {
                            ...current.interval,
                            end: event.target.value,
                          },
                        }))
                      }
                    />
                  </div>
                );
              })}
            </div>
          </section>

          <div className="settings-actions">
            <button
              type="button"
              className="button secondary"
              onClick={() => {
                setForm(toForm(settings));
                setError('');
              }}
              disabled={saving || !isDirty}
            >
              <RefreshCw size={15} aria-hidden="true" />
              Descartar cambios
            </button>

            <button
              type="submit"
              className="button primary"
              disabled={saving || !isDirty}
            >
              <Save size={15} aria-hidden="true" />
              {saving ? 'Guardando...' : 'Guardar configuración'}
            </button>
          </div>
        </form>

        <aside className="settings-aside">
          <section className="settings-panel">
            <header className="settings-panel-head">
              <h2>Configuración inicial</h2>
              <p>
                {completedSteps} de {steps.length} pasos completados.
              </p>
            </header>

            <div className="settings-progress" aria-hidden="true">
              <span
                style={{
                  width: `${(completedSteps / Math.max(steps.length, 1)) * 100}%`,
                }}
              />
            </div>

            <div className="settings-steps">
              {steps.map((step) => {
                const Icon = step.icon;

                return (
                  <button
                    type="button"
                    className={
                      step.done
                        ? 'settings-step is-done'
                        : 'settings-step'
                    }
                    key={step.label}
                    onClick={() => focusStep(step.target)}
                  >
                    <span className="settings-step-icon">
                      <Icon size={16} aria-hidden="true" />
                    </span>

                    <span className="settings-step-text">
                      <strong>{step.label}</strong>
                      <small>{step.detail}</small>
                    </span>

                    <span className="settings-step-state">
                      {step.done ? (
                        <Check size={15} aria-hidden="true" />
                      ) : (
                        'Pendiente'
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="settings-panel">
            <header className="settings-panel-head">
              <h2>Buenas prácticas</h2>
              <p>
                Cambiar la zona horaria o la moneda afecta cómo se
                muestran los reportes y los importes existentes.
              </p>
            </header>

            <p className="settings-note">
              Los datos demo permanecen intactos. Guarda solo después
              de revisar los cambios.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}
