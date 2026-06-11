import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import type { ConfigType } from '@nestjs/config';
import * as webpush from 'web-push';
import pushConfig from './push.config';
import { PushSubscription } from './entities/push.subscription.entity';
import {
  SaveSubscriptionDto,
  SendNotificationDto,
  SendNotificationResponse,
} from './push.interfaces';
import { PUSH_SUBSCRIPTION_EXPIRED_CODES } from './push.constants';

@Injectable()
export class PushService implements OnModuleInit {
  private readonly logger = new Logger(PushService.name);

  constructor(
    @Inject(pushConfig.KEY)
    private readonly config: ConfigType<typeof pushConfig>,

    @InjectRepository(PushSubscription)
    private readonly pushSubRepo: Repository<PushSubscription>,
  ) {}

  onModuleInit() {
    webpush.setVapidDetails(
      `mailto:${this.config.vapidMailto}`,
      this.config.vapidPublicKey,
      this.config.vapidPrivateKey,
    );
  }

  // ── Subscriptions ──────────────────────────────────────────────────────────

  async saveSubscription(dto: SaveSubscriptionDto): Promise<void> {
    await this.pushSubRepo.upsert(
      {
        userId: dto.userId,
        endpoint: dto.subscription.endpoint,
        p256dh: dto.subscription.keys.p256dh,
        auth: dto.subscription.keys.auth,
        device: dto.device,
      },
      ['endpoint'],
    );
  }

  async removeSubscription(endpoint: string): Promise<void> {
    await this.pushSubRepo.delete({ endpoint });
  }

  // ── Notifications ──────────────────────────────────────────────────────────

  async sendToUser(
    userId: string,
    dto: SendNotificationDto,
  ): Promise<SendNotificationResponse> {
    const subscriptions = await this.pushSubRepo.find({ where: { userId } });

    if (!subscriptions.length) {
      this.logger.warn(`No push subscriptions found for user ${userId}`);
      return { successCount: 0, failureCount: 0 };
    }

    const payload = JSON.stringify({
      title: dto.title,
      body: dto.body,
      url: dto.url ?? '/',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      data: dto.data,
    });

    const results = await Promise.allSettled(
      subscriptions.map((sub) =>
        webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payload,
        ),
      ),
    );

    // clean up expired subscriptions
    const expiredEndpoints: string[] = [];
    let successCount = 0;
    let failureCount = 0;

    results.forEach((result, i) => {
      if (result.status === 'fulfilled') {
        successCount++;
      } else {
        failureCount++;
        const statusCode = (result.reason as { statusCode?: number })
          ?.statusCode;
        if (
          statusCode &&
          PUSH_SUBSCRIPTION_EXPIRED_CODES.includes(statusCode as 404 | 410)
        ) {
          expiredEndpoints.push(subscriptions[i].endpoint);
        }
      }
    });

    if (expiredEndpoints.length) {
      await this.pushSubRepo.delete({ endpoint: In(expiredEndpoints) });
    }

    return { successCount, failureCount };
  }

  async sendToMany(userIds: string[], dto: SendNotificationDto): Promise<void> {
    await Promise.allSettled(
      userIds.map((userId) => this.sendToUser(userId, dto)),
    );
  }
}
