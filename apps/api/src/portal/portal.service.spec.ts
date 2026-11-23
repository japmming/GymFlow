import { ForbiddenException } from '@nestjs/common';

import type { AuthenticatedUser } from '../auth/authenticated-user';
import { EventStatus } from '../generated/prisma/client';
import type { PrismaService } from '../prisma/prisma.service';
import type { EventsService } from '../events/events.service';
import type { ReservationsService } from '../reservations/reservations.service';

import { PortalService } from './portal.service';

interface PrismaMock {
  member: { findFirst: jest.Mock };
  gym: { findFirst: jest.Mock };
  membership: { findFirst: jest.Mock };
  payment: { findMany: jest.Mock };
  reservation: { findFirst: jest.Mock };
}

function createPrismaMock(): PrismaMock {
  return {
    member: { findFirst: jest.fn() },
    gym: { findFirst: jest.fn() },
    membership: { findFirst: jest.fn() },
    payment: { findMany: jest.fn() },
    reservation: { findFirst: jest.fn() },
  };
}

const memberUser: AuthenticatedUser = {
  id: 'user-member',
  gymId: 'gym-1',
  email: 'socio@gymflow.local',
  role: 'MEMBER',
  memberId: 'member-1',
};

const staffUser: AuthenticatedUser = {
  ...memberUser,
  id: 'user-admin',
  email: 'admin@gymflow.local',
  role: 'ADMIN',
  memberId: null,
};

function createService(
  prisma: PrismaMock,
  events?: Partial<EventsService>,
  reservations?: Partial<ReservationsService>,
): PortalService {
  return new PortalService(
    prisma as unknown as PrismaService,
    events as unknown as EventsService,
    reservations as unknown as ReservationsService,
  );
}

describe('PortalService', () => {
  it('rechaza cuentas que no están vinculadas a un socio', async () => {
    const prisma = createPrismaMock();

    await expect(
      createService(prisma).getProfile(staffUser),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('devuelve el perfil del socio y la identidad del gimnasio', async () => {
    const prisma = createPrismaMock();

    prisma.member.findFirst.mockResolvedValue({
      id: 'member-1',
      firstName: 'Valeria',
      lastName: 'Ramos',
      memberCode: 'DEMO-001',
    });
    prisma.gym.findFirst.mockResolvedValue({ name: 'GymFlow Demo' });

    const result = await createService(prisma).getProfile(memberUser);

    expect(result.member.id).toBe('member-1');
    expect(result.gym?.name).toBe('GymFlow Demo');
  });

  it('devuelve la membresía vigente con el saldo calculado', async () => {
    const prisma = createPrismaMock();

    prisma.member.findFirst.mockResolvedValue({ id: 'member-1' });
    prisma.membership.findFirst.mockResolvedValue({
      id: 'membership-1',
      price: { toString: () => '100' },
      plan: { name: 'Mensual' },
      payments: [{ amount: { toString: () => '40' }, status: 'COMPLETED' }],
    });

    const result = await createService(prisma).getMembership(memberUser);

    expect(result?.paidAmount).toBe(40);
    expect(result?.balance).toBe(60);
  });

  it('deriva el socio de la sesión al crear una reserva', async () => {
    const prisma = createPrismaMock();
    const reservations = {
      create: jest.fn().mockResolvedValue({ id: 'reservation-1' }),
    };

    prisma.member.findFirst.mockResolvedValue({ id: 'member-1' });

    await createService(prisma, {}, reservations).createReservation(
      memberUser,
      'event-1',
    );

    expect(reservations.create).toHaveBeenCalledWith('gym-1', {
      eventId: 'event-1',
      memberId: 'member-1',
    });
  });

  it('impide cancelar la reserva de otro socio', async () => {
    const prisma = createPrismaMock();
    const reservations = { cancel: jest.fn() };

    prisma.reservation.findFirst.mockResolvedValue({ memberId: 'member-2' });

    await expect(
      createService(prisma, {}, reservations).cancelReservation(
        memberUser,
        'reservation-1',
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(reservations.cancel).not.toHaveBeenCalled();
  });

  it('solo consulta eventos publicados y próximos', async () => {
    const prisma = createPrismaMock();
    const events = { findAll: jest.fn().mockResolvedValue([]) };

    await createService(prisma, events).getEvents(memberUser);

    expect(events.findAll).toHaveBeenCalledWith(
      'gym-1',
      expect.objectContaining({ status: EventStatus.PUBLISHED }),
    );
  });
});
