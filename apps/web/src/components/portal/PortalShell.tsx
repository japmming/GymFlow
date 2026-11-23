import { useCallback, useEffect, useState } from 'react';
import {
  CalendarDays,
  CreditCard,
  Home,
  LayoutGrid,
  LogOut,
  Receipt,
  X,
  type LucideIcon,
} from 'lucide-react';

import { useAuth } from '../../auth/AuthProvider';
import {
  cancelMyReservation,
  createMyReservation,
  getMyEvents,
  getMyMembership,
  getMyPayments,
  getMyProfile,
  getMyReservations,
} from '../../services/api';
import {
  DEFAULT_PORTAL_PAGE,
  PORTAL_PAGE_LABELS,
  navigateToPortal,
  readPortalPageFromHash,
  type PortalPage,
} from '../../types/navigation';
import { LoadingState } from '../ui/LoadingState';
import { useToast } from '../ui/ToastProvider';

import {
  PortalEvents,
  PortalMembership,
  PortalOverview,
  PortalPayments,
  PortalReservations,
  type PortalData,
} from './PortalPages';

const NAV_ITEMS: Array<{
  page: PortalPage;
  label: string;
  icon: LucideIcon;
}> = [
  { page: 'overview', label: 'Mi inicio', icon: Home },
  {
    page: 'membership',
    label: 'Mi membresía',
    icon: CreditCard,
  },
  { page: 'payments', label: 'Mis pagos', icon: Receipt },
  {
    page: 'events',
    label: 'Próximos eventos',
    icon: CalendarDays,
  },
  {
    page: 'reservations',
    label: 'Mis inscripciones',
    icon: LayoutGrid,
  },
];

function errorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'Ocurrió un error inesperado.';
}

function initials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function PortalShell() {
  const { user, logout } = useAuth();
  const { notify } = useToast();

  const [page, setPage] = useState<PortalPage>(
    () => readPortalPageFromHash() ?? DEFAULT_PORTAL_PAGE,
  );
  const [data, setData] = useState<PortalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      setError('');

      const [profile, membership, payments, reservations, events] =
        await Promise.all([
          getMyProfile(),
          getMyMembership(),
          getMyPayments(),
          getMyReservations(),
          getMyEvents(),
        ]);

      setData({
        profile,
        membership,
        payments,
        reservations,
        events,
      });
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const handleHashChange = () => {
      const nextPage = readPortalPageFromHash();

      if (nextPage) {
        setPage(nextPage);
      }
    };

    window.addEventListener('hashchange', handleHashChange);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  useEffect(() => {
    document.title = `${PORTAL_PAGE_LABELS[page]} · GymFlow`;
  }, [page]);

  useEffect(() => {
    if (!sidebarOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSidebarOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [sidebarOpen]);

  const handleNavigate = (nextPage: PortalPage) => {
    navigateToPortal(nextPage);
    setPage(nextPage);
    setSidebarOpen(false);

    window.requestAnimationFrame(() => {
      document.getElementById('main-content')?.focus();
    });
  };

  const handleReserve = async (eventId: string) => {
    try {
      setBusyId(eventId);

      await createMyReservation(eventId);
      await load();

      notify('Inscripción confirmada.');
    } catch (error) {
      notify(errorMessage(error), 'error');
    } finally {
      setBusyId(null);
    }
  };

  const handleCancel = async (reservationId: string) => {
    try {
      setBusyId(reservationId);

      await cancelMyReservation(reservationId);
      await load();

      notify('La inscripción fue cancelada.');
    } catch (error) {
      notify(errorMessage(error), 'error');
    } finally {
      setBusyId(null);
    }
  };

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await logout();
    } finally {
      setLoggingOut(false);
    }
  };

  if (!user) {
    return null;
  }

  const firstName = data?.profile.member.firstName ?? user.firstName;
  const lastName = data?.profile.member.lastName ?? user.lastName;
  const gymName = data?.profile.gym.name ?? 'GymFlow';

  return (
    <div className="app-shell portal-shell">
      <a
        className="skip-link"
        href="#main-content"
        onClick={(event) => {
          event.preventDefault();

          document.getElementById('main-content')?.focus();
        }}
      >
        Saltar al contenido
      </a>

      <aside
        className={sidebarOpen ? 'sidebar is-open' : 'sidebar'}
        aria-label="Navegación del portal"
      >
        <div className="sidebar-brand">
          <span className="sidebar-logo" aria-hidden="true">
            GF
          </span>

          <div className="sidebar-brand-text">
            <strong>GymFlow</strong>
            <span>Portal del socio</span>
          </div>

          <button
            type="button"
            className="sidebar-close"
            onClick={() => setSidebarOpen(false)}
            aria-label="Cerrar menú"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section">
            <span className="sidebar-section-label">
              Mi cuenta
            </span>

            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = item.page === page;

              return (
                <button
                  key={item.page}
                  type="button"
                  className={
                    active
                      ? 'sidebar-link is-active'
                      : 'sidebar-link'
                  }
                  aria-current={active ? 'page' : undefined}
                  onClick={() => handleNavigate(item.page)}
                >
                  <Icon size={18} strokeWidth={2} aria-hidden="true" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        <div className="sidebar-live">
          <span className="sidebar-live-dot" aria-hidden="true" />

          <div>
            <strong>{gymName}</strong>
            <span>Tu espacio de socio</span>
          </div>
        </div>

        <div className="sidebar-profile">
          <span className="sidebar-avatar" aria-hidden="true">
            {initials(firstName, lastName)}
          </span>

          <div className="sidebar-profile-text">
            <strong>
              {firstName} {lastName}
            </strong>
            <span>Socio</span>
          </div>

          <button
            type="button"
            className="sidebar-logout"
            onClick={() => void handleLogout()}
            disabled={loggingOut}
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
          >
            <LogOut size={17} aria-hidden="true" />
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <button
          type="button"
          className="sidebar-scrim"
          aria-label="Cerrar menú"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="app-main">
        <header className="topbar portal-topbar">
          <button
            type="button"
            className="topbar-menu"
            aria-label="Abrir menú"
            onClick={() => setSidebarOpen(true)}
          >
            <LayoutGrid size={19} aria-hidden="true" />
          </button>

          <div className="topbar-heading">
            <span className="page-eyebrow">Portal del socio</span>
            <h1>{PORTAL_PAGE_LABELS[page]}</h1>
          </div>

          <span className="portal-topbar-code">
            {data?.profile.member.memberCode ?? 'Socio'}
          </span>
        </header>

        <main
          className="app-content portal-content"
          id="main-content"
          tabIndex={-1}
        >
          {loading ? (
            <LoadingState label="Cargando tu información..." />
          ) : error ? (
            <div className="alert error" role="alert">
              <p>{error}</p>
              <button
                type="button"
                className="button secondary"
                onClick={() => void load()}
              >
                Reintentar
              </button>
            </div>
          ) : (
            data && (
              <>
                {page === 'overview' && (
                  <PortalOverview
                    data={data}
                    currency={data.profile.gym.currency}
                    busyId={busyId}
                    onNavigate={handleNavigate}
                    onReserve={(id) => void handleReserve(id)}
                    onCancel={(id) => void handleCancel(id)}
                  />
                )}

                {page === 'membership' && (
                  <PortalMembership
                    data={data}
                    currency={data.profile.gym.currency}
                    busyId={busyId}
                    onNavigate={handleNavigate}
                    onReserve={(id) => void handleReserve(id)}
                    onCancel={(id) => void handleCancel(id)}
                  />
                )}

                {page === 'payments' && (
                  <PortalPayments
                    data={data}
                    currency={data.profile.gym.currency}
                    busyId={busyId}
                    onNavigate={handleNavigate}
                    onReserve={(id) => void handleReserve(id)}
                    onCancel={(id) => void handleCancel(id)}
                  />
                )}

                {page === 'events' && (
                  <PortalEvents
                    data={data}
                    currency={data.profile.gym.currency}
                    busyId={busyId}
                    onNavigate={handleNavigate}
                    onReserve={(id) => void handleReserve(id)}
                    onCancel={(id) => void handleCancel(id)}
                  />
                )}

                {page === 'reservations' && (
                  <PortalReservations
                    data={data}
                    currency={data.profile.gym.currency}
                    busyId={busyId}
                    onNavigate={handleNavigate}
                    onReserve={(id) => void handleReserve(id)}
                    onCancel={(id) => void handleCancel(id)}
                  />
                )}
              </>
            )
          )}
        </main>
      </div>
    </div>
  );
}
