import type { CreatePlanRequest, Plan } from '../types/plan';
import type {
  CreateMembershipRequest,
  Membership,
} from '../types/membership';
import type { Member } from '../types/member';
import type { DashboardSummary } from '../types/dashboard';
import type { GymSettings, UpdateGymRequest } from '../types/gym';
import type { ReportsResponse } from '../types/report';
import type {
  CreateEventRequest,
  EventFilters,
  GymEvent,
  UpdateEventRequest,
} from '../types/event';
import type { CreatePaymentRequest, Payment } from '../types/payment';
import type {
  Attendance,
  AttendanceFilters,
  AttendancesResponse,
  CheckInRequest,
} from '../types/attendance';
import type {
  AuthSession,
  AuthUser,
  CreateUserRequest,
  ManagedUser,
  UpdateUserRequest,
} from '../types/auth';
import type {
  CreateEventPaymentRequest,
  CreateReservationRequest,
  EventPayment,
  RegisterPaymentResponse,
  Reservation,
  ReservationFilters,
} from '../types/reservation';
import type { MyProfile } from '../types/portal';
import type {
  MemberActivity,
  MemberNote,
} from '../types/crm';

const API_URL =
  import.meta.env.VITE_API_URL ??
  'http://localhost:3000/api/v1';

let accessToken: string | null = null;
let refreshPromise: Promise<AuthSession | null> | null = null;
let refreshedHandler: ((user: AuthUser) => void) | null = null;
let expiredHandler: (() => void) | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function setSessionHandlers(handlers: {
  onRefreshed?: (user: AuthUser) => void;
  onExpired?: () => void;
}): () => void {
  refreshedHandler = handlers.onRefreshed ?? null;
  expiredHandler = handlers.onExpired ?? null;

  return () => {
    refreshedHandler = null;
    expiredHandler = null;
  };
}

async function readErrorMessage(
  response: Response,
): Promise<string> {
  let message = 'Ocurrió un error en la solicitud.';

  try {
    const error = await response.json();

    if (typeof error.message === 'string') {
      message = error.message;
    } else if (Array.isArray(error.message)) {
      message = error.message.join(', ');
    }
  } catch {
    // Mantener mensaje genérico.
  }

  return message;
}

async function refreshSession(): Promise<AuthSession | null> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const response = await fetch(`${API_URL}/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
        });

        if (!response.ok) {
          return null;
        }

        const session = (await response.json()) as AuthSession;

        accessToken = session.accessToken;
        refreshedHandler?.(session.user);

        return session;
      } catch {
        return null;
      } finally {
        refreshPromise = null;
      }
    })();
  }

  return refreshPromise;
}

async function request<T>(
  endpoint: string,
  options?: RequestInit,
  retried = false,
): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    cache: 'no-store',
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken
        ? { Authorization: `Bearer ${accessToken}` }
        : {}),
      ...options?.headers,
    },
  });

  if (
    response.status === 401 &&
    !retried &&
    !endpoint.startsWith('/auth/')
  ) {
    const session = await refreshSession();

    if (session) {
      return request<T>(endpoint, options, true);
    }

    accessToken = null;
    expiredHandler?.();
  }

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

export const api = {
  get: <T>(endpoint: string) =>
    request<T>(endpoint),

  post: <T>(endpoint: string, body: unknown) =>
    request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  patch: <T>(endpoint: string, body: unknown) =>
    request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  delete: <T>(endpoint: string) =>
    request<T>(endpoint, {
      method: 'DELETE',
    }),
};

export const login = async (
  email: string,
  password: string,
): Promise<AuthSession> => {
  return request<AuthSession>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
};

export const restoreSession = async (): Promise<AuthSession | null> => {
  const session = await refreshSession();

  if (!session) {
    accessToken = null;
  }

  return session;
};

export const logout = async (): Promise<void> => {
  try {
    await fetch(`${API_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
  } finally {
    accessToken = null;
  }
};

export const getGymSettings = async (): Promise<GymSettings> => {
  return request<GymSettings>('/gym');
};

export const updateGymSettings = async (
  data: UpdateGymRequest,
): Promise<GymSettings> => {
  return request<GymSettings>('/gym', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
};

export const getUsers = async (): Promise<ManagedUser[]> => {
  return request<ManagedUser[]>('/users');
};

export const createUser = async (
  data: CreateUserRequest,
): Promise<ManagedUser> => {
  return request<ManagedUser>('/users', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const updateUser = async (
  id: string,
  data: UpdateUserRequest,
): Promise<ManagedUser> => {
  return request<ManagedUser>(`/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
};

export const getPlans = async (): Promise<Plan[]> => {
  return request<Plan[]>('/plans');
};

export const getPlan = async (id: string): Promise<Plan> => {
  return request<Plan>(`/plans/${id}`);
};

export const createPlan = async (
  data: CreatePlanRequest,
): Promise<Plan> => {
  return request<Plan>('/plans', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const updatePlan = async (
  id: string,
  data: Partial<CreatePlanRequest>,
): Promise<Plan> => {
  return request<Plan>(`/plans/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
};

export const deactivatePlan = async (
  id: string,
): Promise<Plan> => {
  return request<Plan>(`/plans/${id}`, {
    method: 'DELETE',
  });
};

export const reactivatePlan = async (
  id: string,
): Promise<Plan> => {
  return request<Plan>(`/plans/${id}/reactivate`, {
    method: 'POST',
  });
};

export const getMemberships = async (): Promise<Membership[]> => {
  return request<Membership[]>('/memberships');
};

export const getMembership = async (
  id: string,
): Promise<Membership> => {
  return request<Membership>(`/memberships/${id}`);
};

export const createMembership = async (
  data: CreateMembershipRequest,
): Promise<Membership> => {
  return request<Membership>('/memberships', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const cancelMembership = async (
  id: string,
  reason: string,
): Promise<Membership> => {
  return request<Membership>(
    `/memberships/${id}/cancel`,
    {
      method: 'POST',
      body: JSON.stringify({ reason }),
    },
  );
};

export const getMembers = async (): Promise<Member[]> => {
  const members: Member[] = [];
  let page = 1;
  let totalPages = 1;

  do {
    const response = await request<{
      data: Member[];
      meta: {
        totalPages: number;
      };
    }>(`/members?page=${page}&limit=100`);

    members.push(...response.data);
    totalPages = response.meta.totalPages;
    page += 1;
  } while (page <= totalPages);

  return members;
};

export const reactivateMember = async (
  id: string,
): Promise<Member> => {
  return request<Member>(`/members/${id}/reactivate`, {
    method: 'POST',
  });
};

export const regenerateMemberQr = async (
  id: string,
  reason?: string,
): Promise<Member> => {
  return request<Member>(`/members/${id}/qr-token/regenerate`, {
    method: 'POST',
    body: JSON.stringify({ reason: reason ?? null }),
  });
};

export const getDashboard = async (): Promise<DashboardSummary> => {
  return request<DashboardSummary>('/dashboard');
};

export const getReports = async (filters: {
  from?: string;
  to?: string;
}): Promise<ReportsResponse> => {
  const params = new URLSearchParams();

  if (filters.from) {
    params.set('from', filters.from);
  }

  if (filters.to) {
    params.set('to', filters.to);
  }

  const query = params.toString();

  return request<ReportsResponse>(
    `/reports${query ? `?${query}` : ''}`,
  );
};

export const getPayments = async (): Promise<Payment[]> => {
  return request<Payment[]>('/payments');
};

export const createPayment = async (
  data: CreatePaymentRequest,
): Promise<Payment> => {
  return request<Payment>('/payments', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const reversePayment = async (
  id: string,
  reason: string,
): Promise<Payment> => {
  return request<Payment>(`/payments/${id}/reverse`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
};

export const getAttendances = async (
  filters: AttendanceFilters = {},
): Promise<AttendancesResponse> => {
  const params = new URLSearchParams();

  if (filters.from) {
    params.set('from', filters.from);
  }

  if (filters.to) {
    params.set('to', filters.to);
  }

  if (filters.search?.trim()) {
    params.set('search', filters.search.trim());
  }

  if (filters.page) {
    params.set('page', String(filters.page));
  }

  if (filters.limit) {
    params.set('limit', String(filters.limit));
  }

  const query = params.toString();

  return request<AttendancesResponse>(
    `/attendances${query ? `?${query}` : ''}`,
  );
};

export const checkIn = async (
  data: CheckInRequest,
): Promise<Attendance> => {
  return request<Attendance>(
    '/attendances/check-in',
    {
      method: 'POST',
      body: JSON.stringify(data),
    },
  );
};

export const cancelAttendance = async (
  id: string,
  reason: string,
): Promise<Attendance> => {
  return request<Attendance>(
    `/attendances/${id}/cancel`,
    {
      method: 'POST',
      body: JSON.stringify({ reason }),
    },
  );
};

export const restoreAttendance = async (
  id: string,
): Promise<Attendance> => {
  return request<Attendance>(
    `/attendances/${id}/restore`,
    {
      method: 'POST',
    },
  );
};

export const getEvents = async (
  filters: EventFilters = {},
): Promise<GymEvent[]> => {
  const params = new URLSearchParams();

  if (filters.type) {
    params.set('type', filters.type);
  }

  if (filters.status) {
    params.set('status', filters.status);
  }

  if (filters.search?.trim()) {
    params.set('search', filters.search.trim());
  }

  if (filters.from) {
    params.set('from', filters.from);
  }

  if (filters.to) {
    params.set('to', filters.to);
  }

  const query = params.toString();

  return request<GymEvent[]>(
    `/events${query ? `?${query}` : ''}`,
  );
};

export const createEvent = async (
  data: CreateEventRequest,
): Promise<GymEvent> => {
  return request<GymEvent>('/events', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const updateEvent = async (
  id: string,
  data: UpdateEventRequest,
): Promise<GymEvent> => {
  return request<GymEvent>(`/events/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
};

export const publishEvent = async (
  id: string,
): Promise<GymEvent> => {
  return request<GymEvent>(`/events/${id}/publish`, {
    method: 'PATCH',
  });
};

export const cancelEvent = async (
  id: string,
): Promise<GymEvent> => {
  return request<GymEvent>(`/events/${id}/cancel`, {
    method: 'PATCH',
  });
};

export const getReservations = async (
  filters: ReservationFilters = {},
): Promise<Reservation[]> => {
  const params = new URLSearchParams();

  if (filters.eventId) {
    params.set('eventId', filters.eventId);
  }

  if (filters.memberId) {
    params.set('memberId', filters.memberId);
  }

  if (filters.status) {
    params.set('status', filters.status);
  }

  if (filters.paymentStatus) {
    params.set('paymentStatus', filters.paymentStatus);
  }

  const query = params.toString();

  return request<Reservation[]>(
    `/reservations${query ? `?${query}` : ''}`,
  );
};

export const getReservation = async (
  id: string,
): Promise<Reservation> => {
  return request<Reservation>(`/reservations/${id}`);
};

export const createReservation = async (
  data: CreateReservationRequest,
): Promise<Reservation> => {
  return request<Reservation>('/reservations', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const cancelReservation = async (
  id: string,
): Promise<Reservation> => {
  return request<Reservation>(`/reservations/${id}/cancel`, {
    method: 'PATCH',
  });
};

export const registerEventPayment = async (
  id: string,
  data: CreateEventPaymentRequest,
): Promise<RegisterPaymentResponse> => {
  return request<RegisterPaymentResponse>(
    `/reservations/${id}/payments`,
    {
      method: 'POST',
      body: JSON.stringify(data),
    },
  );
};

export const getReservationPayments = async (
  id: string,
): Promise<EventPayment[]> => {
  return request<EventPayment[]>(
    `/reservations/${id}/payments`,
  );
};

export const getEventReservations = async (
  eventId: string,
): Promise<Reservation[]> => {
  return request<Reservation[]>(
    `/reservations/event/${eventId}`,
  );
};

// CRM interno (ADMIN y RECEPCIÓN)

export const getMemberNotes = async (
  memberId: string,
): Promise<MemberNote[]> =>
  request<MemberNote[]>(`/members/${memberId}/notes`);

export const createMemberNote = async (
  memberId: string,
  body: string,
): Promise<MemberNote> =>
  request<MemberNote>(`/members/${memberId}/notes`, {
    method: 'POST',
    body: JSON.stringify({ body }),
  });

export const updateMemberNote = async (
  memberId: string,
  noteId: string,
  body: string,
): Promise<MemberNote> =>
  request<MemberNote>(
    `/members/${memberId}/notes/${noteId}`,
    {
      method: 'PATCH',
      body: JSON.stringify({ body }),
    },
  );

export const deleteMemberNote = async (
  memberId: string,
  noteId: string,
): Promise<{ success: true }> =>
  request<{ success: true }>(
    `/members/${memberId}/notes/${noteId}`,
    { method: 'DELETE' },
  );

export const getMemberActivity = async (
  memberId: string,
): Promise<MemberActivity[]> =>
  request<MemberActivity[]>(`/members/${memberId}/activity`);

// Portal del socio (MEMBER)

export const getMyProfile = async (): Promise<MyProfile> =>
  request<MyProfile>('/me');

export const getMyMembership = async (): Promise<Membership | null> =>
  request<Membership | null>('/me/membership');

export const getMyPayments = async (): Promise<Payment[]> =>
  request<Payment[]>('/me/payments');

export const getMyReservations = async (): Promise<Reservation[]> =>
  request<Reservation[]>('/me/reservations');

export const getMyEvents = async (): Promise<GymEvent[]> =>
  request<GymEvent[]>('/me/events');

export const createMyReservation = async (
  eventId: string,
): Promise<Reservation> =>
  request<Reservation>('/me/reservations', {
    method: 'POST',
    body: JSON.stringify({ eventId }),
  });

export const cancelMyReservation = async (
  id: string,
): Promise<Reservation> =>
  request<Reservation>(`/me/reservations/${id}/cancel`, {
    method: 'PATCH',
  });