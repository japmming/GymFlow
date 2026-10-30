import type { CreatePlanRequest, Plan,} from '../types/plan';
import type {CreateMembershipRequest, Membership,} from '../types/membership';
import type { Member } from '../types/member';
import type { DashboardSummary } from '../types/dashboard';
import type { CreatePaymentRequest, Payment } from '../types/payment';
import type {
  Attendance,
  AttendanceFilters,
  AttendancesResponse,
  CheckInRequest,
} from '../types/attendance';

const API_URL =
  import.meta.env.VITE_API_URL ??
  'http://localhost:3000/api/v1';

async function request<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
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

    throw new Error(message);
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

export const getDashboard = async (): Promise<DashboardSummary> => {
  return request<DashboardSummary>('/dashboard');
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