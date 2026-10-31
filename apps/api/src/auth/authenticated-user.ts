import type { UserRole } from '../generated/prisma/client';

export interface AuthenticatedUser {
  id: string;
  gymId: string;
  email: string;
  role: UserRole;
}
