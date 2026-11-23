export type UserRole = 'ADMIN' | 'RECEPTION' | 'MEMBER';

export interface AuthUser {
  id: string;
  gymId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  memberId: string | null;
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
  memberId?: string | null;
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  memberId?: string | null;
  active?: boolean;
  password?: string;
}
