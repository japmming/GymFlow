export type UserRole = 'ADMIN' | 'RECEPTION';

export interface AuthUser {
  id: string;
  gymId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  lastLoginAt: string | null;
}

export interface AuthSession {
  accessToken: string;
  user: AuthUser;
}

export interface ManagedUser extends AuthUser {
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  role: UserRole;
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  active?: boolean;
  password?: string;
}
