import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import { UserPayload } from '../auth.dto'

interface AuthenticatedRequest extends Request {
  user: UserPayload
}

export type ApiUser = {
  id: string
  email: string
}

export const CurrentUser = createParamDecorator((property: keyof UserPayload | undefined, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>()

  const user = request.user

  return property ? user?.[property] : user
})
