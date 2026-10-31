import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';

import { RolesGuard } from './roles.guard';

function createContext(role?: 'ADMIN' | 'RECEPTION'): ExecutionContext {
  return {
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({
      getRequest: () => ({
        user: role
          ? {
              id: 'user-1',
              gymId: 'gym-1',
              email: 'user@gymflow.local',
              role,
            }
          : undefined,
      }),
    }),
  } as unknown as ExecutionContext;
}

function createGuard(requiredRoles?: string[]): RolesGuard {
  const reflector = {
    getAllAndOverride: jest.fn().mockReturnValue(requiredRoles),
  };

  return new RolesGuard(reflector as unknown as Reflector);
}

describe('RolesGuard', () => {
  it('permite rutas sin roles declarados', () => {
    const guard = createGuard(undefined);

    expect(guard.canActivate(createContext())).toBe(true);
  });

  it('permite el rol autorizado', () => {
    const guard = createGuard(['ADMIN']);

    expect(guard.canActivate(createContext('ADMIN'))).toBe(true);
  });

  it('bloquea roles no autorizados', () => {
    const guard = createGuard(['ADMIN']);

    expect(() => guard.canActivate(createContext('RECEPTION'))).toThrow(
      ForbiddenException,
    );
  });

  it('exige autenticación cuando hay roles declarados', () => {
    const guard = createGuard(['RECEPTION']);

    expect(() => guard.canActivate(createContext())).toThrow(
      UnauthorizedException,
    );
  });
});
