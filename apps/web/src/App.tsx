import { lazy, Suspense, useState } from 'react';

import { MembersPage } from './components/members/MembersPage';
import { PlansPage } from './components/plans/PlansPage';
import { MembershipsPage } from './components/memberships/MembershipsPage';
import { DashboardPage } from './components/dashboard/DashboardPage';
import { PaymentsPage } from './components/payments/PaymentsPage';

const AttendancePage = lazy(() =>
  import('./components/attendance/AttendancePage').then(
    (module) => ({ default: module.AttendancePage }),
  ),
);

type Page = 'members' | 'plans' | 'memberships' | 'dashboard' | 'payments' | 'attendance';

function App() {
  const [page, setPage] = useState<Page>('dashboard');

  return (
    <div className="app">
      <header className="app-header">
        <h1>GymFlow</h1>

        <nav>
          <button
            type="button"
            onClick={() => setPage('members')}
          >
            Miembros
          </button>

          <button
            type="button"
            onClick={() => setPage('plans')}
          >
            Planes
          </button>
          <button
            type="button"
            onClick={() => setPage('memberships')}
          >
            Membresías
          </button>
          <button
            type="button"
            onClick={() => setPage('dashboard')}
          >
            Dashboard
          </button>
          <button
            type="button"
            onClick={() => setPage('payments')}
          >
            Pagos
          </button>
          <button
            type="button"
            onClick={() => setPage('attendance')}
          >
            Asistencia
          </button>
        </nav>
      </header>

      <main className="app-content">
        {page === 'members' && <MembersPage />}

        {page === 'plans' && <PlansPage />}

        {page === 'memberships' && <MembershipsPage />}

        {page === 'dashboard' && <DashboardPage />}

        {page === 'payments' && <PaymentsPage />}

        {page === 'attendance' && (
          <Suspense fallback={<p>Cargando asistencia...</p>}>
            <AttendancePage />
          </Suspense>
        )}
      </main>
    </div>
  );
}

export default App;