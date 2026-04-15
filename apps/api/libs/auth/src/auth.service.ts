import { Injectable } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import bcrypt from 'bcryptjs';
import { UserPayload } from './auth.dto'

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

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
}
export type { UserPayload }

