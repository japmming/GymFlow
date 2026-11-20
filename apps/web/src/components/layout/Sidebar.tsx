import {
  BadgeDollarSign,
  CalendarDays,
  CreditCard,
  Dumbbell,
  LayoutDashboard,
  LogOut,
  ScanLine,
  Settings,
  UserCog,
  Users,
  Wallet,
  X,
  type LucideIcon,
} from 'lucide-react';

import { useAuth } from '../../auth/AuthProvider';
import type { Page } from '../../types/navigation';
import { useDashboardData } from '../dashboard/DashboardDataProvider';

interface SidebarItem {
  page?: Page;
  label: string;
  icon: LucideIcon;
  adminOnly?: boolean;
  soon?: boolean;
}

interface SidebarSection {
  label: string;
  items: SidebarItem[];
}

const SECTIONS: SidebarSection[] = [
  {
    label: 'Principal',
    items: [
      {
        page: 'dashboard',
        label: 'Inicio',
        icon: LayoutDashboard,
      },
      {
        page: 'attendance',
        label: 'Control de acceso',
        icon: ScanLine,
      },
    ],
  },
  {
    label: 'Gestión',
    items: [
      {
        page: 'members',
        label: 'Socios',
        icon: Users,
      },
      {
        page: 'memberships',
        label: 'Membresías',
        icon: CreditCard,
      },
      {
        page: 'payments',
        label: 'Pagos',
        icon: Wallet,
      },
      {
        page: 'plans',
        label: 'Planes',
        icon: BadgeDollarSign,
        adminOnly: true,
      },
    ],
  },
  {
    label: 'Operación',
    items: [
      {
        page: 'events',
        label: 'Eventos',
        icon: CalendarDays,
      },
      {
        label: 'Entrenadores',
        icon: Dumbbell,
        soon: true,
      },
    ],
  },
  {
    label: 'Sistema',
    items: [
      {
        page: 'users',
        label: 'Usuarios',
        icon: UserCog,
        adminOnly: true,
      },
      {
        label: 'Configuración',
        icon: Settings,
        soon: true,
      },
    ],
  },
];

interface SidebarProps {
  currentPage: Page;
  open: boolean;
  onClose: () => void;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
  loggingOut: boolean;
}

function getInitials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function Sidebar({
  currentPage,
  open,
  onClose,
  onNavigate,
  onLogout,
  loggingOut,
}: SidebarProps) {
  const { user, isAdmin } = useAuth();
  const { data } = useDashboardData();

  const todayCheckIns = data?.summary.attendance.today ?? 0;

  return (
    <aside
      className={open ? 'sidebar is-open' : 'sidebar'}
      aria-label="Navegación lateral"
    >
      <div className="sidebar-brand">
        <span className="sidebar-logo" aria-hidden="true">
          GF
        </span>

        <div className="sidebar-brand-text">
          <strong>GymFlow</strong>
          <span>Gym operations</span>
        </div>

        <button
          type="button"
          className="sidebar-close"
          onClick={onClose}
          aria-label="Cerrar menú"
        >
          <X size={18} aria-hidden="true" />
        </button>
      </div>

      <nav className="sidebar-nav">
        {SECTIONS.map((section) => (
          <div className="sidebar-section" key={section.label}>
            <span className="sidebar-section-label">
              {section.label}
            </span>

            {section.items
              .filter(
                (item) => !item.adminOnly || isAdmin,
              )
              .map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.page === currentPage;

                return (
                  <button
                    key={item.label}
                    type="button"
                    className={[
                      'sidebar-link',
                      isActive ? 'is-active' : '',
                      item.soon ? 'is-soon' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    aria-current={
                      isActive ? 'page' : undefined
                    }
                    disabled={item.soon}
                    onClick={() => {
                      if (item.page) {
                        onNavigate(item.page);
                      }
                    }}
                  >
                    <Icon
                      size={18}
                      strokeWidth={2}
                      aria-hidden="true"
                    />

                    <span>{item.label}</span>

                    {item.soon && (
                      <span className="sidebar-soon">
                        Pronto
                      </span>
                    )}
                  </button>
                );
              })}
          </div>
        ))}
      </nav>

      <div className="sidebar-live">
        <span className="sidebar-live-dot" aria-hidden="true" />

        <div>
          <strong>Gimnasio abierto</strong>
          <span>
            {todayCheckIns}{' '}
            {todayCheckIns === 1 ? 'ingreso' : 'ingresos'} hoy
          </span>
        </div>
      </div>

      {user && (
        <div className="sidebar-profile">
          <span className="sidebar-avatar" aria-hidden="true">
            {getInitials(user.firstName, user.lastName)}
          </span>

          <div className="sidebar-profile-text">
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
            className="sidebar-logout"
            onClick={onLogout}
            disabled={loggingOut}
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
          >
            <LogOut size={17} aria-hidden="true" />
          </button>
        </div>
      )}
    </aside>
  );
}
