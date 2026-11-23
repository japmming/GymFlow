export const OPENING_DAYS = [
  { key: 'monday', label: 'Lunes' },
  { key: 'tuesday', label: 'Martes' },
  { key: 'wednesday', label: 'Miércoles' },
  { key: 'thursday', label: 'Jueves' },
  { key: 'friday', label: 'Viernes' },
  { key: 'saturday', label: 'Sábado' },
  { key: 'sunday', label: 'Domingo' },
] as const;

export type OpeningDayKey = (typeof OPENING_DAYS)[number]['key'];

export interface OpeningInterval {
  start: string;
  end: string;
}

export interface OpeningDay {
  closed: boolean;
  interval: OpeningInterval;
}

export type OpeningHours = Record<OpeningDayKey, OpeningDay>;

export interface GymSettings {
  id: string;
  name: string;
  slug: string;
  timezone: string;
  currency: string;
  logoUrl: string | null;
  openingHours: OpeningHours | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateGymRequest {
  name?: string;
  slug?: string;
  timezone?: string;
  currency?: string;
  logoUrl?: string | null;
  openingHours?: OpeningHours;
}
