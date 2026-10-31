import { lazy, Suspense, useState } from 'react';

import { AuthProvider, useAuth } from './auth/AuthProvider';
import { LoginPage } from './components/auth/LoginPage';
import { MembersPage } from './components/members/MembersPage';
import { PlansPage } from './components/plans/PlansPage';
import { MembershipsPage } from './components/memberships/MembershipsPage';
import { DashboardPage } from './components/dashboard/DashboardPage';
import { PaymentsPage } from './components/payments/PaymentsPage';
import { UsersPage } from './components/users/UsersPage';

const AttendancePage = lazy(() =>
  import('./components/attendance/AttendancePage').then(
    (module) => ({ default: module.AttendancePage }),
  ),
);

type Page =
  | 'members'
  | 'plans'
  | 'memberships'
  | 'dashboard'
  | 'payments'
  | 'attendance'
  | 'users';

interface NavItem {
  page: Page;
  label: string;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { page: 'dashboard', label: 'Dashboard' },
  { page: 'attendance', label: 'Asistencia' },
  { page: 'members', label: 'Miembros' },
  { page: 'memberships', label: 'Membresías' },
  { page: 'payments', label: 'Pagos' },
  { page: 'plans', label: 'Planes', adminOnly: true },
  { page: 'users', label: 'Usuarios', adminOnly: true },
];

function AppShell() {
  const { user, loading, isAdmin, logout } = useAuth();

  const [page, setPage] = useState<Page>('dashboard');
  const [loggingOut, setLoggingOut] = useState(false);

  if (loading) {
    return (
      <div className="app-loading">
        <span className="app-spinner" />
        Cargando sesión...
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  const allowedPage =
    (page === 'plans' || page === 'users') && !isAdmin
      ? 'dashboard'
      : page;

  const handleLogout = async () => {
    try {
      setLoggingOut(true);

      await logout();
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-brand">
          <span className="app-logo">GF</span>
          <h1>GymFlow</h1>
        </div>

        <nav>
          {navItems
            .filter((item) => !item.adminOnly || isAdmin)
            .map((item) => (
              <button
                key={item.page}
                type="button"
                className={
                  allowedPage === item.page ? 'active' : undefined
                }
                onClick={() => setPage(item.page)}
              >
                {item.label}
              </button>
            ))}
        </nav>

        <div className="app-session">
          <div className="app-user">
            <strong>
              {user.firstName} {user.lastName}
            </strong>

            <span>
              {user.role === 'ADMIN'
                ? 'Administrador'
                : 'Recepción'}
            </span>
          </div>

          <button
            type="button"
            className="app-logout"
            onClick={handleLogout}
            disabled={loggingOut}
          >
            {loggingOut ? 'Saliendo...' : 'Salir'}
          </button>
        </div>
      </header>

      <main className="app-content">
        {allowedPage === 'members' && <MembersPage />}

        {allowedPage === 'plans' && <PlansPage />}

        {allowedPage === 'memberships' && <MembershipsPage />}

        {allowedPage === 'dashboard' && <DashboardPage />}

        {allowedPage === 'payments' && <PaymentsPage />}

        {allowedPage === 'users' && <UsersPage />}

        {allowedPage === 'attendance' && (
          <Suspense fallback={<p>Cargando asistencia...</p>}>
            <AttendancePage />
          </Suspense>
        )}
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}

export default App;
