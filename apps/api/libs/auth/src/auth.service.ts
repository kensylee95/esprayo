import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import { GoogleTokenResponse, UserPayload } from './auth.dto';
import { OAuth2Client } from 'google-auth-library';
import AuthConfig from './auth.config';
import type { ConfigType } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    @Inject('GOOGLE_CLIENT')
    private readonly googleClient: OAuth2Client,
    @Inject(AuthConfig.KEY)
    private readonly config: ConfigType<typeof AuthConfig>,
  ) {}

  async exchangeGoogleCodeForIdToken(
    code: string,
  ): Promise<GoogleTokenResponse> {
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: this.config.googleClientId,
        client_secret: this.config.googleClientSecret,
        redirect_uri: this.config.googleRedirectUri,
        grant_type: 'authorization_code',
      }),
    });
    const data = (await tokenResponse.json()) as GoogleTokenResponse;
    if (!data.id_token) {
      throw new Error(`No id_token returned: ${JSON.stringify(data)}`);
    }
    return data;
  }

  generateToken = (user: UserPayload): string => {
    const payload = {
      id: user.id,
      email: user.email,
    };

    return this.jwtService.sign(payload);
  };

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  async comparePasswords(
    plainTextPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainTextPassword, hashedPassword);
  }

  verifyToken(token: string): UserPayload {
    return this.jwtService.verify<UserPayload>(token);
  }

  async VerifyGoogleToken(token: string) {
    const ticket = await this.googleClient.verifyIdToken({
      idToken: token,
    });

    const payload = ticket.getPayload();
    return payload;
  }
}
export type { UserPayload };
