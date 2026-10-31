import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import { createHash, randomBytes } from 'node:crypto';

import type { User, UserRole } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';

import { REFRESH_TOKEN_BYTES, REFRESH_TOKEN_TTL_DAYS } from './auth.constants';
import { LoginDto } from './dto/login.dto';
import { verifyPassword } from './password';

export interface AuthUser {
  id: string;
  gymId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  lastLoginAt: Date | null;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(dto: LoginDto): Promise<AuthSession> {
    const email = dto.email.trim().toLowerCase();
    const user = await this.prisma.user.findFirst({
      where: {
        email,
      },
    });

    const passwordMatches = user
      ? await verifyPassword(dto.password, user.passwordHash)
      : false;

    if (!user || !passwordMatches) {
      throw new UnauthorizedException('Correo o contraseña incorrectos.');
    }

    if (!user.active) {
      throw new ForbiddenException(
        'Tu usuario está desactivado. Contacta al administrador.',
      );
    }

    const updatedUser = await this.prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        lastLoginAt: new Date(),
      },
    });

    return this.issueSession(updatedUser);
  }

  async refresh(rawToken?: string): Promise<AuthSession> {
    if (!rawToken) {
      throw new UnauthorizedException(
        'No hay una sesión activa. Inicia sesión nuevamente.',
      );
    }

    const tokenHash = this.hashToken(rawToken);

    const stored = await this.prisma.refreshToken.findUnique({
      where: {
        tokenHash,
      },
      include: {
        user: true,
      },
    });

    if (!stored) {
      throw new UnauthorizedException(
        'Tu sesión expiró. Inicia sesión nuevamente.',
      );
    }

    if (stored.revokedAt) {
      // Un token ya usado puede indicar robo o reutilización:
      // se invalidan todas las sesiones del usuario.
      await this.revokeAllForUser(stored.userId);

      throw new UnauthorizedException(
        'Tu sesión ya no es válida. Inicia sesión nuevamente.',
      );
    }

    if (stored.expiresAt.getTime() <= Date.now()) {
      await this.revokeToken(stored.id);

      throw new UnauthorizedException(
        'Tu sesión expiró. Inicia sesión nuevamente.',
      );
    }

    if (!stored.user.active) {
      await this.revokeAllForUser(stored.userId);

      throw new ForbiddenException(
        'Tu usuario está desactivado. Contacta al administrador.',
      );
    }

    const refreshToken = this.generateRefreshToken();
    const accessToken = await this.signAccessToken(stored.user);

    await this.prisma.$transaction([
      this.prisma.refreshToken.update({
        where: {
          id: stored.id,
        },
        data: {
          revokedAt: new Date(),
        },
      }),
      this.prisma.refreshToken.create({
        data: {
          userId: stored.userId,
          tokenHash: this.hashToken(refreshToken),
          expiresAt: this.refreshExpiry(),
        },
      }),
    ]);

    return {
      accessToken,
      refreshToken,
      user: this.toAuthUser(stored.user),
    };
  }

  async logout(rawToken?: string): Promise<void> {
    if (!rawToken) {
      return;
    }

    await this.prisma.refreshToken.updateMany({
      where: {
        tokenHash: this.hashToken(rawToken),
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  async getProfile(userId: string): Promise<AuthUser> {
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        active: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException(
        'Tu sesión ya no es válida. Inicia sesión nuevamente.',
      );
    }

    return this.toAuthUser(user);
  }

  getRefreshTokenTtlMs(): number {
    return this.refreshTtlDays * 24 * 60 * 60 * 1000;
  }

  private get refreshTtlDays(): number {
    const configured = Number(
      this.config.get('REFRESH_TOKEN_TTL_DAYS') ?? REFRESH_TOKEN_TTL_DAYS,
    );

    return Number.isFinite(configured) && configured > 0
      ? configured
      : REFRESH_TOKEN_TTL_DAYS;
  }

  private async issueSession(user: User): Promise<AuthSession> {
    const accessToken = await this.signAccessToken(user);
    const refreshToken = this.generateRefreshToken();

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: this.hashToken(refreshToken),
        expiresAt: this.refreshExpiry(),
      },
    });

    await this.prisma.refreshToken.deleteMany({
      where: {
        userId: user.id,
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    return {
      accessToken,
      refreshToken,
      user: this.toAuthUser(user),
    };
  }

  private signAccessToken(user: User): Promise<string> {
    return this.jwt.signAsync({
      sub: user.id,
      gymId: user.gymId,
      email: user.email,
      role: user.role,
    });
  }

  private generateRefreshToken(): string {
    return randomBytes(REFRESH_TOKEN_BYTES).toString('base64url');
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private refreshExpiry(): Date {
    return new Date(Date.now() + this.getRefreshTokenTtlMs());
  }

  private async revokeToken(id: string): Promise<void> {
    await this.prisma.refreshToken.update({
      where: {
        id,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  private async revokeAllForUser(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  private toAuthUser(user: User): AuthUser {
    return {
      id: user.id,
      gymId: user.gymId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      lastLoginAt: user.lastLoginAt,
    };
  }
}
