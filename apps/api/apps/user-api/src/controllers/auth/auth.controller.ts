import {
  Controller,
  Post,
  Body,
  UnauthorizedException,
  BadRequestException,
  InternalServerErrorException,
  Query,
  Res,
  Get,
  Inject,
} from '@nestjs/common';
import * as Joi from 'joi';
import type { AuthUser } from './auth.dto';
import { AuthService, Public, UserPayload } from '@modules/auth/src';
import { UsersService } from '@modules/users/src';
import { WalletService } from '@modules/wallet/wallet.service';
import { OtpService } from '@modules/otp/otp.service';
import { TermiiService } from '@modules/termii/termii.service';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { REDIS_CLIENT } from '@modules/redis/redis.module';
import type Redis from 'ioredis';
import { nanoid } from 'nanoid';

// How many OTP sends a single phone number may trigger per window,
// independent of the per-IP throttle above (prevents SMS-bombing a victim
// from many IPs/devices).
const PHONE_OTP_RATE_LIMIT = 3;
const PHONE_OTP_RATE_WINDOW_SECONDS = 60 * 60; // 1 hour

// Short-lived one-time code used to hand off the JWT from the Google OAuth
// redirect to the frontend without putting the real access token in a URL
// (URLs end up in server logs, browser history, and Referer headers).
const AUTH_CODE_TTL_SECONDS = 60;
const authCodeKey = (code: string) => `auth:exchange-code:${code}`;

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UsersService,
    private readonly walletService: WalletService,
    private readonly otpService: OtpService,
    private readonly termiiService: TermiiService,
    @Inject(REDIS_CLIENT)
    private readonly redis: Redis,
  ) {}

  // -----------------------------------
  // LOCAL LOGIN (EMAIL + PASSWORD)
  // -----------------------------------
  @Public()
  @Post('login')
  async signIn(@Body() loginDto: AuthUser): Promise<{ accessToken: string }> {
    const schema = Joi.object<AuthUser>({
      email: Joi.string().required(),
      password: Joi.string().required(),
    });

    const validationResult = schema.validate(loginDto);
    if (validationResult.error)
      throw new BadRequestException(validationResult.error.message);

    const user = await this.userService.findUserByEmail(
      validationResult.value.email,
    );

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials supplied');
    }

    const isPasswordValid = await this.authService.comparePasswords(
      validationResult.value.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials supplied');
    }

    const payload: UserPayload = {
      id: user.id,
      email: user.email ?? undefined,
      phoneNumber: user.phoneNumber ?? undefined,
    };

    return { accessToken: this.authService.generateToken(payload) };
  }

  // -----------------------------------
  // PHONE LOGIN/REGISTER — STEP 1: SEND OTP
  // -----------------------------------
  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 1 } }) // 1 request per minute
  @Post('phone/send-otp')
  async sendPhoneOtp(
    @Body() body: { phoneNumber: string },
  ): Promise<{ message: string }> {
    const schema = Joi.object<{ phoneNumber: string }>({
      phoneNumber: Joi.string().required(),
    });

    const validationResult = schema.validate(body);
    if (validationResult.error)
      throw new BadRequestException(validationResult.error.message);

    const { phoneNumber } = validationResult.value;

    // Per-phone-number rate limit — the @Throttle above is per-IP, which
    // doesn't stop someone from spamming OTPs to a *victim's* number using
    // multiple IPs/devices (SMS-bombing / Termii cost abuse).
    const rateLimitKey = `otp:ratelimit:phone:${phoneNumber}`;
    const attemptsInWindow = await this.redis.incr(rateLimitKey);
    if (attemptsInWindow === 1) {
      await this.redis.expire(rateLimitKey, PHONE_OTP_RATE_WINDOW_SECONDS);
    }
    if (attemptsInWindow > PHONE_OTP_RATE_LIMIT) {
      throw new BadRequestException(
        'Too many OTP requests for this number, please try again later',
      );
    }

    // Invalidate any existing OTP before sending a new one
    await this.otpService.deleteByPhone(phoneNumber);
    const { pinId, smsStatus } = await this.termiiService.sendOtp({
      to: phoneNumber,
    });

    if (!smsStatus) {
      throw new BadRequestException('Failed to send OTP, please try again');
    }

    await this.otpService.createOtp({
      phone: phoneNumber,
      pinId,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    return { message: 'OTP sent successfully' };
  }

  // -----------------------------------
  // PHONE LOGIN/REGISTER — STEP 2: VERIFY OTP
  // -----------------------------------
  @Public()
  @Post('phone/verify-otp')
  async verifyPhoneOtp(
    @Body() body: { phoneNumber: string; pin: string },
  ): Promise<{ accessToken: string }> {
    const schema = Joi.object<{ phoneNumber: string; pin: string }>({
      phoneNumber: Joi.string().required(),
      pin: Joi.string().length(6).required(),
    });

    const validationResult = schema.validate(body);
    if (validationResult.error)
      throw new BadRequestException(validationResult.error.message);

    const otp = await this.otpService.findByPhone(
      validationResult.value.phoneNumber,
    );

    if (!otp || otp.expiresAt < new Date()) {
      throw new UnauthorizedException('OTP expired, please request a new one');
    }

    if (otp.attempts >= 3) {
      await this.otpService.deleteByPhone(validationResult.value.phoneNumber);
      throw new UnauthorizedException(
        'Too many attempts, please request a new OTP',
      );
    }

    const { verified } = await this.termiiService.verifyOtp({
      pinId: otp.pinId,
      pin: validationResult.value.pin,
    });

    if (verified !== 'True') {
      await this.otpService.incrementAttempts(otp.id);
      throw new UnauthorizedException('Invalid OTP');
    }

    // OTP verified — clean up before issuing token
    await this.otpService.deleteByPhone(validationResult.value.phoneNumber);

    // Find or create user — OTP possession proves phone ownership
    let user = await this.userService.findUserByPhone(
      validationResult.value.phoneNumber,
    );
    if (!user) {
      user = await this.userService.createPhoneUser({
        phoneNumber: validationResult.value.phoneNumber,
      });
      if (!user)
        throw new InternalServerErrorException('Failed to create user account');
      await this.walletService.createWallet(user.id);
    }

    const payload: UserPayload = {
      id: user.id,
      email: user.email ?? undefined,
      phoneNumber: user.phoneNumber ?? undefined,
    };

    return { accessToken: this.authService.generateToken(payload) };
  }

  // -----------------------------------
  // GOOGLE LOGIN (OAUTH)
  // -----------------------------------

  @Public()
  @Get('google/callback')
  async googleCallback(@Query('code') code: string, @Res() res: Response) {
    if (!code) {
      throw new BadRequestException('Missing Google code');
    }

    const tokens = await this.authService.exchangeGoogleCodeForIdToken(code);
    const idToken = tokens.id_token;

    const googlePayload = await this.authService.VerifyGoogleToken(idToken);
    if (!googlePayload) {
      throw new UnauthorizedException('Google authentication failed');
    }

    const { email, name, sub } = googlePayload;
    if (!email || !name) {
      throw new BadRequestException('Invalid Google account data');
    }

    const parts = name.trim().split(/\s+/);
    const firstName = parts[0] || '';
    const lastName = parts.slice(1).join(' ') || '';

    const user = await this.userService.createGoogleUser({
      email,
      firstName,
      lastName,
      googleId: sub,
    });

    // createWallet is idempotent — safe to call on every login
    await this.walletService.createWallet(user.id);

    const payload: UserPayload = {
      id: user.id,
      email: user.email ?? undefined,
      phoneNumber: user.phoneNumber ?? undefined,
    };
    const accessToken = this.authService.generateToken(payload);

    // Don't put the real JWT in the redirect URL — URLs are logged by
    // servers/CDNs, kept in browser history, and can leak via Referer
    // headers. Instead hand off a short-lived, single-use random code and
    // let the frontend exchange it for the token via POST.
    const exchangeCode = nanoid();
    await this.redis.set(
      authCodeKey(exchangeCode),
      accessToken,
      'EX',
      AUTH_CODE_TTL_SECONDS,
      'NX',
    );

    return res.redirect(
      `${process.env.FRONT_END_URL}/capture-auth-redirect/${exchangeCode}`,
    );
  }

  // -----------------------------------
  // EXCHANGE ONE-TIME CODE FOR ACCESS TOKEN
  // -----------------------------------
  @Public()
  @Post('exchange-code')
  async exchangeCode(
    @Body() body: { code: string },
  ): Promise<{ accessToken: string }> {
    const schema = Joi.object<{ code: string }>({
      code: Joi.string().required(),
    });

    const validationResult = schema.validate(body);
    if (validationResult.error)
      throw new BadRequestException(validationResult.error.message);

    const key = authCodeKey(validationResult.value.code);

    // GETDEL — read and delete in one atomic round trip so the code can
    // never be exchanged twice.
    const accessToken = await this.redis.getdel(key);

    if (!accessToken) {
      throw new UnauthorizedException('Invalid or expired code');
    }

    return { accessToken };
  }
}
