import { randomInt } from 'node:crypto';

import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { QueryMemberDto } from './dto/query-member.dto';

@Injectable()
export class MembersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(gymId: string, query: QueryMemberDto) {
    const { search, page = 1, limit = 10 } = query;

    const skip = (page - 1) * limit;

    const where = {
      gymId,

      ...(search
        ? {
            OR: [
              {
                firstName: {
                  contains: search,
                  mode: 'insensitive' as const,
                },
              },
              {
                lastName: {
                  contains: search,
                  mode: 'insensitive' as const,
                },
              },
              {
                documentNumber: {
                  contains: search,
                  mode: 'insensitive' as const,
                },
              },
              {
                memberCode: {
                  contains: search,
                  mode: 'insensitive' as const,
                },
              },
            ],
          }
        : {}),
    };

    const [members, total] = await Promise.all([
      this.prisma.member.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          memberships: {
            orderBy: {
              endDate: 'desc',
            },
            take: 1,
            include: {
              plan: true,
            },
          },
        },
      }),

      this.prisma.member.count({
        where,
      }),
    ]);

    const data = members.map(({ memberships, ...member }) => ({
      ...member,
      latestMembership: memberships[0] ?? null,
    }));

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(gymId: string, id: string) {
    const member = await this.prisma.member.findFirst({
      where: {
        id,
        gymId,
      },
    });

    if (!member) {
      throw new NotFoundException('Socio no encontrado');
    }

    return member;
  }

  async create(gymId: string, dto: CreateMemberDto) {
    if (dto.documentNumber) {
      const existingMember = await this.prisma.member.findFirst({
        where: {
          gymId,
          documentNumber: dto.documentNumber,
        },
      });

      if (existingMember) {
        throw new ConflictException(
          'Ya existe un socio con este número de documento',
        );
      }
    }

    const memberCode = await this.resolveMemberCode(gymId, dto.memberCode);

    return this.prisma.member.create({
      data: {
        gymId,
        firstName: dto.firstName,
        lastName: dto.lastName,
        documentNumber: dto.documentNumber,
        memberCode,
        phone: dto.phone,
        email: dto.email,
      },
    });
  }

  private async resolveMemberCode(
    gymId: string,
    memberCode?: string,
  ): Promise<string> {
    const normalized = memberCode?.trim().toUpperCase();

    if (normalized) {
      const existingMember = await this.prisma.member.findFirst({
        where: {
          gymId,
          memberCode: normalized,
        },
      });

      if (existingMember) {
        throw new ConflictException('Ya existe un socio con este código.');
      }

      return normalized;
    }

    return this.generateMemberCode(gymId);
  }

  private async generateMemberCode(gymId: string): Promise<string> {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

    for (let attempt = 0; attempt < 10; attempt += 1) {
      let code = 'C';

      for (let index = 0; index < 5; index += 1) {
        code += alphabet[randomInt(alphabet.length)];
      }

      const existingMember = await this.prisma.member.findFirst({
        where: {
          gymId,
          memberCode: code,
        },
      });

      if (!existingMember) {
        return code;
      }
    }

    throw new ConflictException(
      'No se pudo generar un código de socio único. Intenta nuevamente.',
    );
  }

  async update(gymId: string, id: string, dto: UpdateMemberDto) {
    await this.findOne(gymId, id);

    if (dto.documentNumber) {
      const existingMember = await this.prisma.member.findFirst({
        where: {
          gymId,
          documentNumber: dto.documentNumber,
          NOT: {
            id,
          },
        },
      });

      if (existingMember) {
        throw new ConflictException(
          'Ya existe otro socio con este número de documento',
        );
      }
    }

    const data = { ...dto };

    if (dto.memberCode !== undefined) {
      const normalized = dto.memberCode.trim().toUpperCase();

      if (normalized) {
        const existingMember = await this.prisma.member.findFirst({
          where: {
            gymId,
            memberCode: normalized,
            NOT: {
              id,
            },
          },
        });

        if (existingMember) {
          throw new ConflictException('Ya existe otro socio con este código.');
        }

        data.memberCode = normalized;
      } else {
        delete data.memberCode;
      }
    }

    return this.prisma.member.update({
      where: {
        id,
      },
      data,
    });
  }

  async deactivate(gymId: string, id: string) {
    await this.findOne(gymId, id);

    return this.prisma.member.update({
      where: {
        id,
      },
      data: {
        status: 'INACTIVE',
      },
    });
  }
}
