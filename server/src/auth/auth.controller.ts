import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Post,
  Res,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { loginUserDto } from './dto/loginDto';
import { LoginResponse } from './interfaces';
import { Auth } from './guards/auth-role.guard';
import { GetUser } from './decorators/getUser.decorator';
import { User } from '@prisma/client';
import { Public } from './guards/public.decorator';

@Controller('auth')
@Public()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({
    summary: 'LOGIN',
    description: 'Public endpoint to login and get the Access Token',
  })
  @ApiResponse({ status: 200, description: 'Ok', type: LoginResponse })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 500, description: 'Server error' }) //Swagger
  async login(@Res() response, @Body() loginUserDto: loginUserDto) {
    const data = await this.authService.loginUser(
      loginUserDto.email,
      loginUserDto.password,
    );
    // Set refresh token as httpOnly cookie (rotating token will be set on refresh)
    const isProd = process.env.NODE_ENV === 'production';
    response.cookie('refresh_token', data.refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days default
    });
    // Return only access token in body (client should not access refresh cookie)
    response
      .status(HttpStatus.OK)
      .send({ user: data.user, token: data.accessToken });
  }

  @Post('refresh')
  @ApiOperation({
    summary: 'REFRESH TOKEN',
    description:
      'Read refresh token from httpOnly cookie and issue new tokens.',
  })
  @ApiResponse({ status: 200, description: 'Ok', type: LoginResponse })
  async refresh(@Req() req, @Res() res) {
    const refreshToken = req.cookies?.refresh_token;
    if (!refreshToken) {
      return res
        .status(HttpStatus.UNAUTHORIZED)
        .send({ message: 'No refresh token' });
    }
    try {
      const data = await this.authService.refreshTokenFromToken(refreshToken);
      const isProd = process.env.NODE_ENV === 'production';
      res.cookie('refresh_token', data.refreshToken, {
        httpOnly: true,
        secure: isProd,
        sameSite: 'lax',
        path: '/',
        maxAge: 1000 * 60 * 60 * 24 * 7,
      });
      return res
        .status(HttpStatus.OK)
        .send({ user: data.user, token: data.accessToken });
    } catch (err) {
      // Clear cookie on invalid token
      res.clearCookie('refresh_token', { path: '/' });
      return res
        .status(HttpStatus.UNAUTHORIZED)
        .send({ message: 'Invalid refresh token' });
    }
  }

  @Post('logout')
  @ApiOperation({
    summary: 'LOGOUT',
    description: 'Clear refresh token cookie',
  })
  async logout(@Res() res) {
    // Clear refresh cookie on logout
    res.clearCookie('refresh_token', { path: '/' });
    return res.status(HttpStatus.OK).send({ message: 'Logged out' });
  }
}
