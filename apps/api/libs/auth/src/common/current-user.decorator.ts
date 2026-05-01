import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { Socket } from 'socket.io';
import { UserPayload } from '../auth.dto';

type HttpRequest = Request & {
  user: UserPayload;
};

type WsClient = Socket & {
  request: {
    user?: UserPayload;
  };
};

export const CurrentUser = createParamDecorator(
  (property: keyof UserPayload | undefined, ctx: ExecutionContext) => {
    let user: UserPayload | undefined;

    const type = ctx.getType<'http' | 'ws' | 'rpc'>();

    if (type === 'http') {
      const request = ctx.switchToHttp().getRequest<HttpRequest>();
      user = request.user as UserPayload | undefined;
    }

    if (type === 'ws') {
      const client = ctx.switchToWs().getClient<WsClient>();
      user = client.request?.user;
    }

    return property ? user?.[property] : user;
  },
);
