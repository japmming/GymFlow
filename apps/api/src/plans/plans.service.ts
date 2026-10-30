import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';

@Injectable()
export class PlansService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(gymId: string) {
    return this.prisma.plan.findMany({
      where: {
        gymId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(gymId: string, id: string) {
    const plan = await this.prisma.plan.findFirst({
      where: {
        id,
        gymId,
      },
    });

    if (!plan) {
      throw new NotFoundException('Plan no encontrado');
    }

    return plan;
  }

  async create(gymId: string, dto: CreatePlanDto) {
    return this.prisma.plan.create({
      data: {
        gymId,
        name: dto.name,
        description: dto.description,
        durationDays: dto.durationDays,
        price: dto.price,
        active: dto.active ?? true,
      },
    });
  }

  async update(gymId: string, id: string, dto: UpdatePlanDto) {
    await this.findOne(gymId, id);

    return this.prisma.plan.update({
      where: {
        id,
      },
      data: dto,
    });
  }

  async deactivate(gymId: string, id: string) {
    await this.findOne(gymId, id);

    return this.prisma.plan.update({
      where: {
        id,
      },
      data: {
        active: false,
      },
    });
  }

  async reactivate(gymId: string, id: string) {
    await this.findOne(gymId, id);

    return this.prisma.plan.update({
      where: {
        id,
      },
      data: {
        active: true,
      },
    });
  }
}
