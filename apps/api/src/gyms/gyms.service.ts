import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Prisma, type Gym } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';

import {
  OPENING_DAYS,
  TIME_PATTERN,
  type OpeningHours,
  type UpdateGymDto,
} from './dto/update-gym.dto';

const gymSettingsSelect = {
  id: true,
  name: true,
  slug: true,
  timezone: true,
  currency: true,
  logoUrl: true,
  openingHours: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.GymSelect;

type GymRow = Pick<
  Gym,
  | 'id'
  | 'name'
  | 'slug'
  | 'timezone'
  | 'currency'
  | 'logoUrl'
  | 'openingHours'
  | 'createdAt'
  | 'updatedAt'
>;

export interface GymSettings {
  id: string;
  name: string;
  slug: string;
  timezone: string;
  currency: string;
  logoUrl: string | null;
  openingHours: OpeningHours | null;
  createdAt: Date;
  updatedAt: Date;
}

function isOpeningHours(value: unknown): value is OpeningHours {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  for (const day of OPENING_DAYS) {
    const entry = candidate[day];

    if (!entry || typeof entry !== 'object') {
      return false;
    }

    const { closed, interval } = entry as Record<string, unknown>;

    if (
      typeof closed !== 'boolean' ||
      !interval ||
      typeof interval !== 'object'
    ) {
      return false;
    }

    const { start, end } = interval as Record<string, unknown>;

    if (typeof start !== 'string' || typeof end !== 'string') {
      return false;
    }

    if (!TIME_PATTERN.test(start) || !TIME_PATTERN.test(end)) {
      return false;
    }

    if (start >= end) {
      return false;
    }
  }

  return true;
}

function normalizeLogoUrl(value: string | null): string | null {
  const trimmed = value?.trim();

  return trimmed || null;
}

@Injectable()
export class GymsService {
  constructor(private readonly prisma: PrismaService) {}

  async findOne(gymId: string): Promise<GymSettings> {
    const gym = await this.prisma.gym.findFirst({
      where: {
        id: gymId,
      },
      select: gymSettingsSelect,
    });

    if (!gym) {
      throw new NotFoundException('Gimnasio no encontrado.');
    }

    return this.toSettings(gym);
  }

  async update(gymId: string, dto: UpdateGymDto): Promise<GymSettings> {
    const current = await this.prisma.gym.findFirst({
      where: {
        id: gymId,
      },
      select: {
        id: true,
        slug: true,
      },
    });

    if (!current) {
      throw new NotFoundException('Gimnasio no encontrado.');
    }

    if (dto.slug !== undefined && dto.slug !== current.slug) {
      const existing = await this.prisma.gym.findFirst({
        where: {
          slug: dto.slug,
          id: {
            not: gymId,
          },
        },
        select: {
          id: true,
        },
      });

      if (existing) {
        throw new ConflictException(
          'Ya existe un gimnasio con ese identificador.',
        );
      }
    }

    const data: Prisma.GymUpdateInput = {};

    if (dto.name !== undefined) {
      data.name = dto.name.trim();
    }

    if (dto.slug !== undefined) {
      data.slug = dto.slug;
    }

    if (dto.timezone !== undefined) {
      data.timezone = dto.timezone.trim();
    }

    if (dto.currency !== undefined) {
      data.currency = dto.currency;
    }

    if (dto.logoUrl !== undefined) {
      data.logoUrl = normalizeLogoUrl(dto.logoUrl);
    }

    if (dto.openingHours !== undefined) {
      data.openingHours = dto.openingHours as unknown as Prisma.InputJsonValue;
    }

    try {
      const updated = await this.prisma.gym.update({
        where: {
          id: gymId,
        },
        data,
        select: gymSettingsSelect,
      });

      return this.toSettings(updated);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Ya existe un gimnasio con ese identificador.',
        );
      }

      throw error;
    }
  }

  private toSettings(gym: GymRow): GymSettings {
    return {
      id: gym.id,
      name: gym.name,
      slug: gym.slug,
      timezone: gym.timezone,
      currency: gym.currency,
      logoUrl: gym.logoUrl,
      openingHours: isOpeningHours(gym.openingHours) ? gym.openingHours : null,
      createdAt: gym.createdAt,
      updatedAt: gym.updatedAt,
    };
  }
}
