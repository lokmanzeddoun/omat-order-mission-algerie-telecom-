import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import type { AuthConfig } from 'src/common/configs/config.interface';
import { AuthService, MfaOutcome, SessionOutcome } from './auth.service';
import { loginUserDto } from './dto/loginDto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { MfaSetupDto, MfaVerifyDto } from './dto/mfa.dto';
import { LoginResponse } from './interfaces';
import { Public } from './guards/public.decorator';
import { SameOriginGuard } from './guards/same-origin.guard';
import { REFRESH_COOKIE } from './auth.constants';
import type { ClientMeta } from './sessions/sessions.service';

/**
 * Credential routes: AUTH_RATE_LIMIT (default 5) attempts per minute per IP
 * and account. Resolved per request so the e2e suites can raise it.
 */
const CREDENTIAL_LIMIT = {
  default: {
    limit: () => Number(process.env.AUTH_RATE_LIMIT ?? 5),
    ttl: 60_000,
  },
};

@Controller('auth')
@Public()
@UseGuards(SameOriginGuard)
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle(CREDENTIAL_LIMIT)
  @ApiOperation({
    summary: 'LOGIN',
    description:
      'Checks the password. Returns the access token and sets the refresh cookie, ' +
      'or, for ADMIN/SUPER_ADMIN, an mfaToken for /auth/mfa/*.',
  })
  @ApiResponse({ status: 200, description: 'Ok', type: LoginResponse })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 429, description: 'Too many attempts' })
  async login(
    @Body() dto: loginUserDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const outcome = await this.authService.login(
      dto.email,
      dto.password,
      meta(req),
    );
    return this.respond(outcome, res);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.ACCEPTED)
  @Throttle(CREDENTIAL_LIMIT)
  @ApiOperation({
    summary: 'FORGOT PASSWORD',
    description:
      'Opens a password-reset request for the admins (one pending per user). ' +
      'Always answers 202, whether or not the email exists.',
  })
  @ApiResponse({ status: 202, description: 'Request recorded' })
  @ApiResponse({ status: 429, description: 'Too many attempts' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.authService.requestPasswordReset(dto.email);
    return { accepted: true };
  }

  @Post('mfa/setup')
  @HttpCode(HttpStatus.OK)
  @Throttle(CREDENTIAL_LIMIT)
  @ApiOperation({ summary: 'Start TOTP enrollment (admins without MFA)' })
  setupMfa(@Body() dto: MfaSetupDto) {
    return this.authService.startMfaEnrollment(dto.mfaToken);
  }

  @Post('mfa/verify')
  @HttpCode(HttpStatus.OK)
  @Throttle(CREDENTIAL_LIMIT)
  @ApiOperation({ summary: 'Second factor: TOTP or recovery code' })
  async verifyMfa(
    @Body() dto: MfaVerifyDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const outcome = await this.authService.completeMfa(
      dto.mfaToken,
      dto.code,
      meta(req),
    );
    return this.respond(outcome, res);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'REFRESH TOKEN',
    description:
      'Rotates the httpOnly refresh cookie and issues a new access token.',
  })
  @ApiResponse({ status: 200, description: 'Ok', type: LoginResponse })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const outcome = await this.authService.refresh(
        req.cookies?.[REFRESH_COOKIE],
        meta(req),
      );
      return this.respond(outcome, res);
    } catch (error) {
      this.clearCookie(res);
      throw error;
    }
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'LOGOUT',
    description: 'Revokes the session and clears the cookie',
  })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.authService.logout(req.cookies?.[REFRESH_COOKIE]);
    this.clearCookie(res);
    return { message: 'Logged out' };
  }

  private get auth(): AuthConfig {
    return this.config.get<AuthConfig>('auth');
  }

  private respond(outcome: SessionOutcome | MfaOutcome, res: Response) {
    if (outcome.kind === 'mfa') {
      return { mfa: outcome.stage, mfaToken: outcome.mfaToken };
    }
    res.cookie(REFRESH_COOKIE, outcome.refresh.token, {
      httpOnly: true,
      secure: this.auth.secureCookies,
      sameSite: 'strict',
      path: this.auth.refreshCookiePath,
      expires: outcome.refresh.expiresAt,
    });
    return {
      user: outcome.user,
      token: outcome.accessToken,
      ...(outcome.recoveryCodes
        ? { recoveryCodes: outcome.recoveryCodes }
        : {}),
    };
  }

  private clearCookie(res: Response) {
    const options = {
      httpOnly: true,
      secure: this.auth.secureCookies,
      sameSite: 'strict' as const,
    };
    res.clearCookie(REFRESH_COOKIE, {
      ...options,
      path: this.auth.refreshCookiePath,
    });
    // Cookies set before the path was narrowed to the auth routes.
    res.clearCookie(REFRESH_COOKIE, { ...options, path: '/' });
  }
}

function meta(req: Request): ClientMeta {
  return { ip: req.ip, userAgent: req.headers['user-agent'] };
}
