import 'reflect-metadata';

import {
  ForbiddenException,
  UnauthorizedException,
  type ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import type { AuthenticatedUser } from '../auth/authenticated-user';
import { ROLES_KEY } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { EventType } from '../generated/prisma/client';

import { EventsController } from './events.controller';
import type { EventsService } from './events.service';
import type { CreateEventDto } from './dto/create-event.dto';

type Handler = (...args: never[]) => unknown;

const handlers = {
  findAll: Reflect.get(EventsController.prototype, 'findAll') as Handler,
  findOne: Reflect.get(EventsController.prototype, 'findOne') as Handler,
  publish: Reflect.get(EventsController.prototype, 'publish') as Handler,
  cancel: Reflect.get(EventsController.prototype, 'cancel') as Handler,
};

const adminUser: AuthenticatedUser = {
  id: 'user-admin',
  gymId: 'gym-autenticado',
  email: 'admin@gymflow.local',
  role: 'ADMIN',
};

const receptionUser: AuthenticatedUser = {
  id: 'user-reception',
  gymId: 'gym-autenticado',
  email: 'recepcion@gymflow.local',
  role: 'RECEPTION',
};

const eventPayload: CreateEventDto = {
  name: 'Clase grupal de funcional',
  description: 'Entrenamiento funcional para socios del gimnasio.',
  type: EventType.CLASS,
  startDate: '2026-12-01T10:00:00.000Z',
  endDate: '2026-12-01T11:00:00.000Z',
  capacity: 20,
  price: 0,
  requiresActiveMembership: true,
};

interface EventsServiceMock {
  findAll: jest.Mock;
  findOne: jest.Mock;
  create: jest.Mock;
  update: jest.Mock;
  publish: jest.Mock;
  cancel: jest.Mock;
}

function createServiceMock(): EventsServiceMock {
  return {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    publish: jest.fn(),
    cancel: jest.fn(),
  };
}

function createController(service: EventsServiceMock): EventsController {
  return new EventsController(service as unknown as EventsService);
}

function createContext(
  handler: Handler,
  user?: AuthenticatedUser,
): ExecutionContext {
  return {
    getHandler: () => handler,
    getClass: () => EventsController,
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  } as unknown as ExecutionContext;
}

describe('EventsController roles', () => {
  it('restringe la publicación al rol ADMIN', () => {
    expect(Reflect.getMetadata(ROLES_KEY, handlers.publish)).toEqual(['ADMIN']);
  });

  it('restringe la cancelación al rol ADMIN', () => {
    expect(Reflect.getMetadata(ROLES_KEY, handlers.cancel)).toEqual(['ADMIN']);
  });

  it('permite a RECEPTION listar y consultar eventos', () => {
    const guard = new RolesGuard(new Reflector());

    expect(
      guard.canActivate(createContext(handlers.findAll, receptionUser)),
    ).toBe(true);

    expect(
      guard.canActivate(createContext(handlers.findOne, receptionUser)),
    ).toBe(true);
  });

  it('responde 403 cuando RECEPTION intenta publicar un evento', () => {
    const guard = new RolesGuard(new Reflector());

    expect(() =>
      guard.canActivate(createContext(handlers.publish, receptionUser)),
    ).toThrow(ForbiddenException);
  });

  it('responde 403 cuando RECEPTION intenta cancelar un evento', () => {
    const guard = new RolesGuard(new Reflector());

    expect(() =>
      guard.canActivate(createContext(handlers.cancel, receptionUser)),
    ).toThrow(ForbiddenException);
  });

  it('permite a ADMIN publicar y cancelar eventos', () => {
    const guard = new RolesGuard(new Reflector());

    expect(guard.canActivate(createContext(handlers.publish, adminUser))).toBe(
      true,
    );

    expect(guard.canActivate(createContext(handlers.cancel, adminUser))).toBe(
      true,
    );
  });

  it('responde 401 cuando no hay usuario autenticado', () => {
    const guard = new RolesGuard(new Reflector());

    expect(() => guard.canActivate(createContext(handlers.publish))).toThrow(
      UnauthorizedException,
    );
  });
});

describe('EventsController gym scope', () => {
  it('usa el gimnasio del usuario autenticado en todos los endpoints', async () => {
    const service = createServiceMock();
    const controller = createController(service);
    const user = { ...adminUser, gymId: 'gym-del-token' };

    await controller.findAll(user, {});
    await controller.findOne(user, 'event-1');
    await controller.create(user, eventPayload);
    await controller.update(user, 'event-1', { capacity: 25 });
    await controller.publish(user, 'event-1');
    await controller.cancel(user, 'event-1');

    expect(service.findAll).toHaveBeenCalledWith('gym-del-token', {});
    expect(service.findOne).toHaveBeenCalledWith('gym-del-token', 'event-1');
    expect(service.create).toHaveBeenCalledWith('gym-del-token', eventPayload);
    expect(service.update).toHaveBeenCalledWith('gym-del-token', 'event-1', {
      capacity: 25,
    });
    expect(service.publish).toHaveBeenCalledWith('gym-del-token', 'event-1');
    expect(service.cancel).toHaveBeenCalledWith('gym-del-token', 'event-1');
  });
});
