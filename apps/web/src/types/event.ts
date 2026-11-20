export type EventType = 'CLASS' | 'WORKSHOP' | 'COMPETITION';

export type EventStatus =
  | 'DRAFT'
  | 'PUBLISHED'
  | 'CANCELLED'
  | 'COMPLETED';

export interface GymEvent {
  id: string;
  gymId: string;
  name: string;
  description: string | null;
  type: EventType;
  status: EventStatus;
  startDate: string;
  endDate: string;
  capacity: number;
  price: number | string;
  requiresActiveMembership: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EventFilters {
  type?: EventType;
  status?: EventStatus;
  search?: string;
  from?: string;
  to?: string;
}

export interface CreateEventRequest {
  name: string;
  description?: string | null;
  type: EventType;
  startDate: string;
  endDate: string;
  capacity: number;
  price: number;
  requiresActiveMembership?: boolean;
}

export type UpdateEventRequest = Partial<CreateEventRequest>;
