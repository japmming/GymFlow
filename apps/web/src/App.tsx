import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useState,
} from 'react';

import { AuthProvider, useAuth } from './auth/AuthProvider';
import { LoginPage } from './components/auth/LoginPage';
import { DashboardDataProvider } from './components/dashboard/DashboardDataProvider';
import { DashboardPage } from './components/dashboard/DashboardPage';
import { Sidebar } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { MembersPage } from './components/members/MembersPage';
import { MembershipsPage } from './components/memberships/MembershipsPage';
import { PaymentsPage } from './components/payments/PaymentsPage';
import { PlansPage } from './components/plans/PlansPage';
import { LoadingState } from './components/ui/LoadingState';
import { ToastProvider } from './components/ui/ToastProvider';
import { UsersPage } from './components/users/UsersPage';
import { ThemeProvider } from './theme/ThemeProvider';
import {
  DEFAULT_PAGE,
  PAGE_LABELS,
  navigateTo,
  readPageFromHash,
  type MembersIntent,
  type Page,
} from './types/navigation';

const AttendancePage = lazy(() =>
  import('./components/attendance/AttendancePage').then(
    (module) => ({ default: module.AttendancePage }),
  ),
);

const EventsPage = lazy(() =>
  import('./components/events/EventsPage').then(
    (module) => ({ default: module.EventsPage }),
  ),
);

function AppShell() {
  const { user, loading, isAdmin, logout } = useAuth();

  const [page, setPage] = useState<Page>(
    () => readPageFromHash() ?? DEFAULT_PAGE,
  );
  const [loggingOut, setLoggingOut] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [membersIntent, setMembersIntent] =
    useState<MembersIntent | null>(null);

  const allowedPage =
    (page === 'plans' || page === 'users') && !isAdmin
      ? 'dashboard'
      : page;

  // Mantiene la página sincronizada con el botón atrás/adelante.
  useEffect(() => {
    const handleHashChange = () => {
      const nextPage = readPageFromHash();

      if (nextPage) {
        setPage(nextPage);
      }
    };

    window.addEventListener('hashchange', handleHashChange);

    return () => {
      window.removeEventListener(
        'hashchange',
        handleHashChange,
      );
    };
  }, []);

  // Si el rol no permite la página del enlace, se vuelve al inicio.
  useEffect(() => {
    if (!loading && user && allowedPage !== page) {
      navigateTo(allowedPage);
      setPage(allowedPage);
    }
  }, [allowedPage, loading, page, user]);

  useEffect(() => {
    document.title = user
      ? `${PAGE_LABELS[allowedPage]} · GymFlow`
      : 'Iniciar sesión · GymFlow';
  }, [allowedPage, user]);

  // Cierra el menú móvil con Escape.
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

  const handleIntentHandled = useCallback(() => {
    setMembersIntent(null);
  }, []);

  if (loading) {
    return (
      <div className="app-loading" role="status">
        <span className="app-spinner" aria-hidden="true" />
        Cargando sesión...
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  const handleLogout = async () => {
    try {
      setLoggingOut(true);

      await logout();
    } finally {
      setLoggingOut(false);
    }
  };

  const handleNavigate = (nextPage: Page) => {
    navigateTo(nextPage);
    setPage(nextPage);
    setSidebarOpen(false);

    // Lleva el foco al contenido para lectores de pantalla.
    window.requestAnimationFrame(() => {
      document.getElementById('main-content')?.focus();
    });
  };

  const handleCreateMember = () => {
    setMembersIntent({
      id: Date.now(),
      mode: 'create',
    });

    handleNavigate('members');
  };

  const handleSearchMember = (term: string) => {
    setMembersIntent({
      id: Date.now(),
      mode: 'search',
      term,
    });

    handleNavigate('members');
  };

  return (
    <DashboardDataProvider>
      <div className="app-shell">
        <a
          className="skip-link"
          href="#main-content"
          onClick={(event) => {
            event.preventDefault();

            document
              .getElementById('main-content')
              ?.focus();
          }}
        >
          Saltar al contenido
        </a>

        <Sidebar
          currentPage={allowedPage}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
          loggingOut={loggingOut}
        />

        {sidebarOpen && (
          <button
            type="button"
            className="sidebar-scrim"
            aria-label="Cerrar menú"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <div className="app-main">
          <Topbar
            page={allowedPage}
            onOpenSidebar={() => setSidebarOpen(true)}
            onCreateMember={handleCreateMember}
            onSearchMember={handleSearchMember}
            onNavigate={handleNavigate}
          />

          <main
            className="app-content"
            id="main-content"
            tabIndex={-1}
          >
            {allowedPage === 'members' && (
              <MembersPage
                intent={membersIntent}
                onIntentHandled={handleIntentHandled}
              />
            )}

            {allowedPage === 'plans' && <PlansPage />}

            {allowedPage === 'memberships' && (
              <MembershipsPage />
            )}

            {allowedPage === 'dashboard' && (
              <DashboardPage
                onNavigate={handleNavigate}
                onCreateMember={handleCreateMember}
              />
            )}

            {allowedPage === 'payments' && <PaymentsPage />}

            {allowedPage === 'users' && <UsersPage />}

            {allowedPage === 'attendance' && (
              <Suspense
                fallback={
                  <LoadingState label="Cargando control de acceso..." />
                }
              >
                <AttendancePage />
              </Suspense>
            )}

            {allowedPage === 'events' && (
              <Suspense
                fallback={
                  <LoadingState label="Cargando eventos..." />
                }
              >
                <EventsPage />
              </Suspense>
            )}
          </main>
        </div>
      </div>
    </DashboardDataProvider>
  );
}

function App() {
  return (
    <ToastProvider>
      <ThemeProvider>
        <AuthProvider>
          <AppShell />
        </AuthProvider>
      </ThemeProvider>
    </ToastProvider>
  );
}

export default App;
