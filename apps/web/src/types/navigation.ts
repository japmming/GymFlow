export type Page =
  | 'members'
  | 'plans'
  | 'memberships'
  | 'dashboard'
  | 'payments'
  | 'attendance'
  | 'events'
  | 'users';

export const PAGE_LABELS: Record<Page, string> = {
  dashboard: 'Inicio',
  attendance: 'Control de acceso',
  members: 'Socios',
  memberships: 'Membresías',
  payments: 'Pagos',
  plans: 'Planes',
  events: 'Eventos',
  users: 'Usuarios',
};

export const DEFAULT_PAGE: Page = 'dashboard';

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
