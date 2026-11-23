import { Injectable, NotFoundException } from '@nestjs/common';

import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';

import { CreateMemberNoteDto } from './dto/create-member-note.dto';
import { UpdateMemberNoteDto } from './dto/update-member-note.dto';

export const memberNoteSelect = {
  id: true,
  gymId: true,
  memberId: true,
  authorId: true,
  body: true,
  createdAt: true,
  updatedAt: true,
  author: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
    },
  },
} satisfies Prisma.MemberNoteSelect;

export type MemberNoteRecord = Prisma.MemberNoteGetPayload<{
  select: typeof memberNoteSelect;
}>;

export type MemberActivityType =
  'NOTE' | 'ATTENDANCE' | 'PAYMENT' | 'MEMBERSHIP' | 'RESERVATION';

export interface MemberActivityItem {
  id: string;
  type: MemberActivityType;
  date: string;
  title: string;
  description: string | null;
}

const ACTIVITY_LIMIT = 30;

@Injectable()
export class MemberNotesService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertMember(gymId: string, memberId: string): Promise<void> {
    const member = await this.prisma.member.findFirst({
      where: {
        id: memberId,
        gymId,
      },
      select: {
        id: true,
      },
    });

    if (!member) {
      throw new NotFoundException('Socio no encontrado.');
    }
  }

  async findAll(gymId: string, memberId: string): Promise<MemberNoteRecord[]> {
    await this.assertMember(gymId, memberId);

    return this.prisma.memberNote.findMany({
      where: {
        gymId,
        memberId,
      },
      select: memberNoteSelect,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async create(
    gymId: string,
    memberId: string,
    authorId: string,
    dto: CreateMemberNoteDto,
  ): Promise<MemberNoteRecord> {
    await this.assertMember(gymId, memberId);

    return this.prisma.memberNote.create({
      data: {
        gymId,
        memberId,
        authorId,
        body: dto.body.trim(),
      },
      select: memberNoteSelect,
    });
  }

  async update(
    gymId: string,
    memberId: string,
    noteId: string,
    dto: UpdateMemberNoteDto,
  ): Promise<MemberNoteRecord> {
    await this.assertMember(gymId, memberId);

    const existing = await this.prisma.memberNote.findFirst({
      where: {
        id: noteId,
        gymId,
        memberId,
      },
      select: {
        id: true,
      },
    });

    if (!existing) {
      throw new NotFoundException('La nota no existe para este socio.');
    }

    return this.prisma.memberNote.update({
      where: {
        id: noteId,
      },
      data: {
        body: dto.body.trim(),
      },
      select: memberNoteSelect,
    });
  }

  async remove(
    gymId: string,
    memberId: string,
    noteId: string,
  ): Promise<{ success: true }> {
    await this.assertMember(gymId, memberId);

    const existing = await this.prisma.memberNote.findFirst({
      where: {
        id: noteId,
        gymId,
        memberId,
      },
      select: {
        id: true,
      },
    });

    if (!existing) {
      throw new NotFoundException('La nota no existe para este socio.');
    }

    await this.prisma.memberNote.delete({
      where: {
        id: noteId,
      },
    });

    return { success: true };
  }

  async getActivity(
    gymId: string,
    memberId: string,
  ): Promise<MemberActivityItem[]> {
    await this.assertMember(gymId, memberId);

    const [notes, attendances, payments, memberships, reservations] =
      await Promise.all([
        this.prisma.memberNote.findMany({
          where: { gymId, memberId },
          select: { id: true, body: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: ACTIVITY_LIMIT,
        }),
        this.prisma.attendance.findMany({
          where: { gymId, memberId, cancelled: false },
          select: {
            id: true,
            checkedInAt: true,
            attendanceDate: true,
            source: true,
          },
          orderBy: { checkedInAt: 'desc' },
          take: ACTIVITY_LIMIT,
        }),
        this.prisma.payment.findMany({
          where: { gymId, memberId, status: 'COMPLETED' },
          select: {
            id: true,
            paymentDate: true,
            amount: true,
            method: true,
            membership: { select: { plan: { select: { name: true } } } },
          },
          orderBy: { paymentDate: 'desc' },
          take: ACTIVITY_LIMIT,
        }),
        this.prisma.membership.findMany({
          where: { gymId, memberId },
          select: {
            id: true,
            createdAt: true,
            startDate: true,
            endDate: true,
            status: true,
            plan: { select: { name: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: ACTIVITY_LIMIT,
        }),
        this.prisma.reservation.findMany({
          where: { gymId, memberId },
          select: {
            id: true,
            reservedAt: true,
            status: true,
            event: { select: { name: true } },
          },
          orderBy: { reservedAt: 'desc' },
          take: ACTIVITY_LIMIT,
        }),
      ]);

    const items: MemberActivityItem[] = [
      ...notes.map((note) => ({
        id: note.id,
        type: 'NOTE' as const,
        date: note.createdAt.toISOString(),
        title: 'Nota del equipo',
        description: note.body,
      })),
      ...attendances.map((attendance) => ({
        id: attendance.id,
        type: 'ATTENDANCE' as const,
        date: attendance.checkedInAt.toISOString(),
        title: 'Ingreso al gimnasio',
        description: attendance.source
          ? `Origen: ${attendance.source}`
          : attendance.attendanceDate.toISOString().slice(0, 10),
      })),
      ...payments.map((payment) => ({
        id: payment.id,
        type: 'PAYMENT' as const,
        date: payment.paymentDate.toISOString(),
        title: `Pago de ${Number(payment.amount).toFixed(2)}`,
        description: `${payment.method} · ${payment.membership.plan.name}`,
      })),
      ...memberships.map((membership) => ({
        id: membership.id,
        type: 'MEMBERSHIP' as const,
        date: membership.createdAt.toISOString(),
        title: `Membresía ${membership.plan.name}`,
        description: `${membership.status} · ${membership.startDate
          .toISOString()
          .slice(0, 10)} al ${membership.endDate.toISOString().slice(0, 10)}`,
      })),
      ...reservations.map((reservation) => ({
        id: reservation.id,
        type: 'RESERVATION' as const,
        date: reservation.reservedAt.toISOString(),
        title: `Reserva: ${reservation.event.name}`,
        description: reservation.status,
      })),
    ];

    return items
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, ACTIVITY_LIMIT);
  }
}
