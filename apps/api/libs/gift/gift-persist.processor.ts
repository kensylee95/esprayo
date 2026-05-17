import { Processor, WorkerHost } from '@nestjs/bullmq';

import { Logger } from '@nestjs/common';

import { Job } from 'bullmq';

import { GiftService } from './gift.service';

import { BroadcastGiftJob } from './dtos/gift.dto';

import { GIFTS_PERSIST_QUEUE, PERSIST_GIFT_EVENT } from './job.constants';

@Processor(GIFTS_PERSIST_QUEUE, {
  concurrency: 5,
})
export class GiftPersistProcessor extends WorkerHost {
  private readonly logger = new Logger(GiftPersistProcessor.name);

  constructor(private readonly giftService: GiftService) {
    super();
  }

  async process(job: Job<BroadcastGiftJob>): Promise<void> {
    if (job.name !== PERSIST_GIFT_EVENT) {
      return;
    }

    try {
      await this.giftService.saveGift(job.data);
    } catch (err: unknown) {
      this.logger.error(
        `persist failed (job=${job.id})`,

        err instanceof Error ? err.stack : String(err),
      );

      throw err;
    }
  }
}
