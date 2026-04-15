
import { Controller, Post, Body, UnauthorizedException, BadRequestException } from '@nestjs/common'
import * as Joi from 'joi'
import type { AuthUser } from './auth.dto'
import { AuthService, Public, UserPayload } from '@modules/auth/src'
import { UsersService } from '@modules/users/src'

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UsersService
  ) {}

  @Public()
  @Post('login')
  async signIn(@Body() loginDto: AuthUser): Promise<{ accessToken: string }> {
    const schema = Joi.object<AuthUser>({
      email: Joi.string().required(),
      password: Joi.string().required(),
    })
    const validationResult = schema.validate(loginDto)
    if (validationResult.error) {
      throw new BadRequestException(validationResult.error.message)
    }
    const { email, password } = validationResult.value
    const user = await this.userService.findUserByEmail(email)
    if (!user) throw new UnauthorizedException('Invalid credentials supplied')

    const isPasswordValid = await this.authService.comparePasswords(password, user.passwordHash)
    if (!isPasswordValid) throw new UnauthorizedException('Invalid credentials supplied')

    const payload: UserPayload = { id: user.id, email: user.email}
    return { accessToken: this.authService.generateToken(payload) }
  }
}
