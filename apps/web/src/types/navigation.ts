export type Page =
  | 'members'
  | 'plans'
  | 'memberships'
  | 'dashboard'
  | 'payments'
  | 'attendance'
  | 'events'
  | 'reports'
  | 'users'
  | 'settings';

export const PAGE_LABELS: Record<Page, string> = {
  dashboard: 'Inicio',
  attendance: 'Control de acceso',
  members: 'Socios',
  memberships: 'Membresías',
  payments: 'Pagos',
  plans: 'Planes',
  events: 'Eventos',
  reports: 'Reportes',
  users: 'Usuarios',
  settings: 'Configuración',
};

export const DEFAULT_PAGE: Page = 'dashboard';

export type PortalPage =
  | 'overview'
  | 'membership'
  | 'payments'
  | 'events'
  | 'reservations';

export const PORTAL_PAGE_LABELS: Record<PortalPage, string> = {
  overview: 'Mi inicio',
  membership: 'Mi membresía',
  payments: 'Mis pagos',
  events: 'Próximos eventos',
  reservations: 'Mis inscripciones',
};

export const DEFAULT_PORTAL_PAGE: PortalPage = 'overview';

export function isPortalPage(value: string): value is PortalPage {
  return Object.prototype.hasOwnProperty.call(
    PORTAL_PAGE_LABELS,
    value,
  );
}

export function readPortalPageFromHash(): PortalPage | null {
  const hash = window.location.hash.replace(/^#\/?/, '');

  if (!hash.startsWith('portal/')) {
    return null;
  }

  const page = hash.slice('portal/'.length);

  return isPortalPage(page) ? page : null;
}

export function navigateToPortal(page: PortalPage) {
  const hash = `#/portal/${page}`;

  if (window.location.hash !== hash) {
    window.location.hash = hash;
  }
}

export interface MembersIntent {
  id: number;
  mode: 'create' | 'search';
  term?: string;
}

export function isPage(value: string): value is Page {
  return Object.prototype.hasOwnProperty.call(
    PAGE_LABELS,
    value,
  );
}

export function readPageFromHash(): Page | null {
  const hash = window.location.hash.replace(/^#\/?/, '');

  return isPage(hash) ? hash : null;
}

export function navigateTo(page: Page) {
  if (window.location.hash !== `#/${page}`) {
    window.location.hash = `/${page}`;
  }
}
