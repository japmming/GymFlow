import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { hashPassword } from '../auth/password';
import { Prisma, type User } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

export const publicUserSelect = {
  id: true,
  gymId: true,
  email: true,
  firstName: true,
  lastName: true,
  role: true,
  active: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

export type PublicUser = Omit<User, 'passwordHash'>;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(gymId: string): Promise<PublicUser[]> {
    return this.prisma.user.findMany({
      where: {
        gymId,
      },
      select: publicUserSelect,
      orderBy: [
        {
          role: 'asc',
        },
        {
          createdAt: 'asc',
        },
      ],
    });
  }

  async create(gymId: string, dto: CreateUserDto): Promise<PublicUser> {
    const existing = await this.prisma.user.findFirst({
      where: {
        gymId,
        email: dto.email,
      },
      select: {
        id: true,
      },
    });

    if (existing) {
      throw new ConflictException(
        'Ya existe un usuario con ese correo en este gimnasio.',
      );
    }

    return this.prisma.user.create({
      data: {
        gymId,
        email: dto.email,
        firstName: dto.firstName.trim(),
        lastName: dto.lastName.trim(),
        passwordHash: await hashPassword(dto.password),
        role: dto.role,
      },
      select: publicUserSelect,
    });
  }

  async update(
    gymId: string,
    id: string,
    dto: UpdateUserDto,
    actorId: string,
  ): Promise<PublicUser> {
    const user = await this.prisma.user.findFirst({
      where: {
        id,
        gymId,
      },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado.');
    }

    const nextRole = dto.role ?? user.role;
    const nextActive = dto.active ?? user.active;

    if (id === actorId) {
      if (nextRole !== 'ADMIN') {
        throw new BadRequestException(
          'No puedes quitarte el rol de administrador.',
        );
      }

      if (!nextActive) {
        throw new BadRequestException(
          'No puedes desactivar tu propio usuario.',
        );
      }
    }

    const losesAdminAccess =
      user.role === 'ADMIN' &&
      user.active &&
      (nextRole !== 'ADMIN' || !nextActive);

    if (losesAdminAccess) {
      const otherActiveAdmins = await this.prisma.user.count({
        where: {
          gymId,
          role: 'ADMIN',
          active: true,
          id: {
            not: id,
          },
        },
      });

      if (otherActiveAdmins === 0) {
        throw new BadRequestException(
          'Debe existir al menos un administrador activo.',
        );
      }
    }

    const data: Prisma.UserUpdateInput = {};

    if (dto.firstName !== undefined) {
      data.firstName = dto.firstName.trim();
    }

    if (dto.lastName !== undefined) {
      data.lastName = dto.lastName.trim();
    }

    if (dto.role !== undefined) {
      data.role = dto.role;
    }

    if (dto.active !== undefined) {
      data.active = dto.active;
    }

    if (dto.password !== undefined) {
      data.passwordHash = await hashPassword(dto.password);
    }

    return this.prisma.user.update({
      where: {
        id,
      },
      data,
      select: publicUserSelect,
    });
  }
}
