import { SetMetadata } from '@nestjs/common';

import type { UserRole } from '../../generated/prisma/client';

export const ROLES_KEY = 'roles';

/**
 * Restringe un endpoint o controlador a los roles indicados.
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
