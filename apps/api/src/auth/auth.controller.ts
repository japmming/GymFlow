import { Body, Controller, Get, Post, Req, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiBearerAuth,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { CookieOptions, Request, Response } from 'express';

import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';

import type { AuthenticatedUser } from './authenticated-user';
import {
  REFRESH_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE_PATH,
} from './auth.constants';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import {
  AuthSessionResponseDto,
  AuthUserDto,
} from '../swagger/models/auth.model';
import {
  ErrorResponseDto,
  SuccessResponseDto,
} from '../swagger/models/common.model';
import {
  BEARER_AUTH,
  REFRESH_COOKIE_AUTH,
  SWAGGER_TAGS,
} from '../swagger/swagger.constants';

@ApiTags(SWAGGER_TAGS.AUTH)
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Public()
  @Post('login')
  @ApiOperation({
    summary: 'Iniciar sesión',
    description:
      'Valida el correo y la contraseña. Devuelve un access token JWT y ' +
      'establece la cookie httpOnly con el refresh token.',
  })
  @ApiCreatedResponse({
    description: 'Credenciales válidas. Se emitió una nueva sesión.',
    type: AuthSessionResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Correo o contraseña incorrectos.',
    type: ErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'El usuario está desactivado.',
    type: ErrorResponseDto,
  })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const session = await this.authService.login(dto);

    this.setRefreshCookie(response, session.refreshToken);

    return {
      accessToken: session.accessToken,
      user: session.user,
    };
  }

  @Public()
  @Post('refresh')
  @ApiCookieAuth(REFRESH_COOKIE_AUTH)
  @ApiOperation({
    summary: 'Renovar la sesión',
    description:
      'Rota el refresh token almacenado en la cookie httpOnly y devuelve un ' +
      'nuevo access token. Si el token fue reutilizado, se revocan todas las ' +
      'sesiones del usuario.',
  })
  @ApiCreatedResponse({
    description: 'Sesión renovada correctamente.',
    type: AuthSessionResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'No hay sesión activa o el refresh token expiró.',
    type: ErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'El usuario está desactivado.',
    type: ErrorResponseDto,
  })
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const session = await this.authService.refresh(
      this.readRefreshToken(request),
    );

    this.setRefreshCookie(response, session.refreshToken);

    return {
      accessToken: session.accessToken,
      user: session.user,
    };
  }

  @Public()
  @Post('logout')
  @ApiCookieAuth(REFRESH_COOKIE_AUTH)
  @ApiOperation({
    summary: 'Cerrar sesión',
    description:
      'Revoca el refresh token actual y elimina la cookie de sesión.',
  })
  @ApiCreatedResponse({
    description: 'Sesión cerrada correctamente.',
    type: SuccessResponseDto,
  })
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.authService.logout(this.readRefreshToken(request));

    this.clearRefreshCookie(response);

    return {
      success: true,
    };
  }

  @Get('me')
  @ApiBearerAuth(BEARER_AUTH)
  @ApiOperation({
    summary: 'Obtener el perfil autenticado',
    description:
      'Devuelve los datos del usuario asociado al access token enviado.',
  })
  @ApiOkResponse({
    description: 'Perfil del usuario autenticado.',
    type: AuthUserDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Token ausente, inválido o expirado.',
    type: ErrorResponseDto,
  })
  getProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.getProfile(user.id);
  }

  private readRefreshToken(request: Request): string | undefined {
    const cookies = request.cookies as
      Record<string, string | undefined> | undefined;

    return cookies?.[REFRESH_TOKEN_COOKIE];
  }

  private setRefreshCookie(response: Response, token: string): void {
    response.cookie(REFRESH_TOKEN_COOKIE, token, {
      ...this.baseCookieOptions(),
      maxAge: this.authService.getRefreshTokenTtlMs(),
    });
  }

  private clearRefreshCookie(response: Response): void {
    response.clearCookie(REFRESH_TOKEN_COOKIE, this.baseCookieOptions());
  }

  private baseCookieOptions(): CookieOptions {
    return {
      httpOnly: true,
      secure: this.useSecureCookies(),
      sameSite: 'lax',
      path: REFRESH_TOKEN_COOKIE_PATH,
    };
  }

  private useSecureCookies(): boolean {
    return (
      this.config.get('NODE_ENV') === 'production' ||
      this.config.get('COOKIE_SECURE') === 'true'
    );
  }
}
