export interface Plan {
  id: string;
  name: string;
  description?: string | null;
  durationDays: number;
  price: number | string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePlanRequest {
  name: string;
  description?: string | null;
  durationDays: number;
  price: number;
  active?: boolean;
}