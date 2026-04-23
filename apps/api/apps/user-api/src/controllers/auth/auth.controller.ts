import {
  Controller,
  Post,
  Body,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common'
import * as Joi from 'joi'
import type { AuthUser } from './auth.dto'
import { AuthService, Public, UserPayload } from '@modules/auth/src'
import { UsersService } from '@modules/users/src'

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UsersService,
  ) {}

  // -----------------------------------
  // LOCAL LOGIN (EMAIL + PASSWORD)
  // -----------------------------------
  @Public()
  @Post('login')
  async signIn(
    @Body() loginDto: AuthUser,
  ): Promise<{ accessToken: string }> {
    const schema = Joi.object<AuthUser>({
      email: Joi.string().required(),
      password: Joi.string().required(),
    })

    const { error, value } = schema.validate(loginDto)

    if (error) {
      throw new BadRequestException(error.message)
    }

    const user =
      await this.userService.findUserByEmail(
        value.email,
      )

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException(
        'Invalid credentials supplied',
      )
    }

    const isPasswordValid =
      await this.authService.comparePasswords(
        value.password,
        user.passwordHash,
      )

    if (!isPasswordValid) {
      throw new UnauthorizedException(
        'Invalid credentials supplied',
      )
    }

    const payload: UserPayload = {
      id: user.id,
      email: user.email,
    }

    return {
      accessToken:
        this.authService.generateToken(payload),
    }
  }

  // -----------------------------------
  // GOOGLE LOGIN (OAUTH)
  // -----------------------------------
  @Public()
  @Post('google')
  async googleSignIn(
    @Body() body: { token: string },
  ): Promise<{ accessToken: string }> {
    const schema = Joi.object({
      token: Joi.string().required(),
    })

    const { error, value } = schema.validate(body)

    if (error) {
      throw new BadRequestException(error.message)
    }

    const googlePayload =
      await this.authService.VerifyGoogleToken(
        value.token,
      )

    if (!googlePayload) {
      throw new UnauthorizedException(
        'Google authentication failed',
      )
    }

    const { email, name, sub } = googlePayload

    if (!email || !name) {
      throw new BadRequestException(
        'Invalid Google account data',
      )
    }

    const parts = name.trim().split(/\s+/)

    const firstName = parts[0] || ''
    const lastName =
      parts.slice(1).join(' ') || ''

    const user =
      await this.userService.createGoogleUser({
        email,
        firstName,
        lastName,
        googleId: sub,
      })

    const payload: UserPayload = {
      id: user.id,
      email: user.email,
    }

    return {
      accessToken:
        this.authService.generateToken(payload),
    }
  }
}