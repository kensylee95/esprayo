import { Inject, Injectable } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import bcrypt from 'bcryptjs';
import { UserPayload } from './auth.dto'
import { OAuth2Client } from 'google-auth-library';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    @Inject('GOOGLE_CLIENT')
    private readonly googleClient: OAuth2Client,
  ) {}

  generateToken = (user: UserPayload): string => {
    const payload = {
      id: user.id,
      email: user.email,
    }

    return this.jwtService.sign(payload)
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10)
  }

  async comparePasswords(plainTextPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainTextPassword, hashedPassword)
  }

  verifyToken(token: string): UserPayload {
    return this.jwtService.verify<UserPayload>(token)
  }

  async VerifyGoogleToken(token: string) {
    const ticket = await this.googleClient.verifyIdToken({
      idToken: token,
    });

    const payload = ticket.getPayload();
    return payload
  }
}
export type { UserPayload }

