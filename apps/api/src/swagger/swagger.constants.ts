export const SWAGGER_PATH = 'api/docs';
export const SWAGGER_JSON_PATH = 'api/docs-json';
export const SWAGGER_YAML_PATH = 'api/docs-yaml';

export const BEARER_AUTH = 'JWT-auth';
export const REFRESH_COOKIE_AUTH = 'refresh-cookie';

export const SWAGGER_TAGS = {
  AUTH: 'Autenticación',
  HEALTH: 'Salud',
  MEMBERS: 'Socios',
  PLANS: 'Planes',
  MEMBERSHIPS: 'Membresías',
  PAYMENTS: 'Pagos',
  ATTENDANCES: 'Asistencias',
  DASHBOARD: 'Panel',
  REPORTS: 'Reportes',
  USERS: 'Usuarios',
  EVENTS: 'Eventos',
  GYMS: 'Gimnasio',
  CRM: 'CRM',
  PORTAL: 'Portal del socio',
} as const;
