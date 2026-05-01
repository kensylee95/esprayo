import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';
import { Request } from 'express';
import { Socket } from 'socket.io';

type WsHandshakeAuth = {
  token?: string;
};

type WsClient = Socket & {
  handshake: Socket['handshake'] & {
    auth?: WsHandshakeAuth;
  };
  request?: Request;
};

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  getRequest(context: ExecutionContext): Request {
    const type = context.getType<'http' | 'ws' | 'rpc'>();

    if (type === 'http') {
      return context.switchToHttp().getRequest<Request>();
    }

    if (type === 'ws') {
      const client = context.switchToWs().getClient<WsClient>();

      const token =
        client.handshake?.auth?.token ||
        client.handshake?.headers?.authorization?.split(' ')[1];

      if (!token) {
        throw new UnauthorizedException('No token provided');
      }

      const req: Request = {
        ...client.request,
        headers: {
          ...(client.request?.headers || {}),
          authorization: `Bearer ${token}`,
        },
      } as Request;

      client.request = req;

      return req;
    }

    return context.switchToHttp().getRequest<Request>();
  }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    return super.canActivate(context);
  }
}
