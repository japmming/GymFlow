import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { EventStatus, Prisma } from '../generated/prisma/client';

import { PrismaService } from '../prisma/prisma.service';

import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { QueryEventDto } from './dto/query-event.dto';

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(gymId: string, query: QueryEventDto) {
    const where: Prisma.EventWhereInput = {
      gymId,
    };

    if (query.type) {
      where.type = query.type;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.search?.trim()) {
      where.OR = [
        {
          name: {
            contains: query.search.trim(),
            mode: 'insensitive',
          },
        },
        {
          description: {
            contains: query.search.trim(),
            mode: 'insensitive',
          },
        },
      ];
    }

    if (query.from || query.to) {
      where.startDate = {
        ...(query.from ? { gte: new Date(query.from) } : {}),
        ...(query.to ? { lte: new Date(query.to) } : {}),
      };
    }

    return this.prisma.event.findMany({
      where,
      orderBy: {
        startDate: 'desc',
      },
    });
  }

  async findOne(gymId: string, id: string) {
    const event = await this.prisma.event.findFirst({
      where: {
        id,
        gymId,
      },
    });

    if (!event) {
      throw new NotFoundException('El evento no existe.');
    }

    return event;
  }

  async create(gymId: string, dto: CreateEventDto) {
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    this.validateDates(startDate, endDate);

    return this.prisma.event.create({
      data: {
        gymId,
        name: dto.name.trim(),
        description: dto.description?.trim() || null,
        instructorName: dto.instructorName?.trim() || null,
        type: dto.type,
        startDate,
        endDate,
        capacity: dto.capacity,
        price: dto.price,
        requiresActiveMembership: dto.requiresActiveMembership ?? false,
        status: EventStatus.DRAFT,
      },
    });
  }

  async update(gymId: string, id: string, dto: UpdateEventDto) {
    const event = await this.findOne(gymId, id);

    if (
      event.status === EventStatus.CANCELLED ||
      event.status === EventStatus.COMPLETED
    ) {
      throw new BadRequestException(
        'No se puede modificar un evento cancelado o finalizado.',
      );
    }

    const startDate = dto.startDate ? new Date(dto.startDate) : event.startDate;

    const endDate = dto.endDate ? new Date(dto.endDate) : event.endDate;

    this.validateDates(startDate, endDate);

    return this.prisma.event.update({
      where: {
        id: event.id,
      },
      data: {
        ...(dto.name !== undefined && {
          name: dto.name.trim(),
        }),

        ...(dto.description !== undefined && {
          description: dto.description?.trim() || null,
        }),

        ...(dto.instructorName !== undefined && {
          instructorName: dto.instructorName?.trim() || null,
        }),

        ...(dto.type !== undefined && {
          type: dto.type,
        }),

        ...(dto.startDate !== undefined && {
          startDate,
        }),

        ...(dto.endDate !== undefined && {
          endDate,
        }),

        ...(dto.capacity !== undefined && {
          capacity: dto.capacity,
        }),

        ...(dto.price !== undefined && {
          price: dto.price,
        }),

        ...(dto.requiresActiveMembership !== undefined && {
          requiresActiveMembership: dto.requiresActiveMembership,
        }),
      },
    });
  }

  async publish(gymId: string, id: string) {
    const event = await this.findOne(gymId, id);

    if (event.status !== EventStatus.DRAFT) {
      throw new BadRequestException(
        'Solamente se pueden publicar eventos en borrador.',
      );
    }

    if (event.endDate <= new Date()) {
      throw new BadRequestException(
        'No se puede publicar un evento que ya finalizó.',
      );
    }

    return this.prisma.event.update({
      where: {
        id: event.id,
      },
      data: {
        status: EventStatus.PUBLISHED,
      },
    });
  }

  async cancel(gymId: string, id: string) {
    const event = await this.findOne(gymId, id);

    if (
      event.status === EventStatus.CANCELLED ||
      event.status === EventStatus.COMPLETED
    ) {
      throw new BadRequestException(
        'El evento ya está cancelado o finalizado.',
      );
    }

    return this.prisma.event.update({
      where: {
        id: event.id,
      },
      data: {
        status: EventStatus.CANCELLED,
      },
    });
  }

  private validateDates(startDate: Date, endDate: Date) {
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      throw new BadRequestException('Las fechas del evento no son válidas.');
    }

    if (endDate <= startDate) {
      throw new BadRequestException(
        'La fecha de finalización debe ser posterior al inicio.',
      );
    }
  }
}
