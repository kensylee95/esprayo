import { Body, Controller, Delete, Post } from '@nestjs/common';
import { User } from '@modules/users/src';
import { PushService } from '@modules/push/push.service';
import { SaveSubscriptionDto } from '@modules/push/push.interfaces';
import { CurrentUser } from '@modules/auth/src';

@Controller('push')
export class PushController {
  constructor(private readonly pushService: PushService) {}

  @Post('subscribe')
  async subscribe(
    @Body()
    body: {
      subscription: SaveSubscriptionDto['subscription'];
      device?: 'android' | 'ios' | 'web';
    },
    @CurrentUser() user: User,
  ) {
    await this.pushService.saveSubscription({
      userId: user.id,
      subscription: body.subscription,
      device: body.device,
    });
    return { success: true };
  }

  @Delete('subscribe')
  async unsubscribe(@Body() body: { endpoint: string }) {
    await this.pushService.removeSubscription(body.endpoint);
    return { success: true };
  }
}
