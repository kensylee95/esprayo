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

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UsersService,
    private readonly walletService: WalletService,
    private readonly otpService: OtpService,
    private readonly termiiService: TermiiService,
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

    // Invalidate any existing OTP before sending a new one
    await this.otpService.deleteByPhone(validationResult.value.phoneNumber);
    const { pinId, smsStatus } = await this.termiiService.sendOtp({
      to: validationResult.value.phoneNumber,
    });

    if (!smsStatus) {
      throw new BadRequestException('Failed to send OTP, please try again');
    }

    await this.otpService.createOtp({
      phone: validationResult.value.phoneNumber,
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
    return res.redirect(
      `${process.env.FRONT_END_URL}/capture-auth-redirect/${accessToken}`,
    );
  }
}
