import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import {
  WalletTransactionType,
  WalletTransactionStatus,
} from './constants.wallet';

export type DebitJob = {
  userId: string;
  amount: number;
  reference: string;
  newBalance: number;
};

@Processor('wallet', { concurrency: 2 })
export class WalletProcessor extends WorkerHost {
  private readonly logger = new Logger(WalletProcessor.name);

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {
    super();
  }

  async process(job: Job<DebitJob>): Promise<void> {
    if (job.name !== 'debit') return;

    const { userId, amount, reference, newBalance } = job.data;

    try {
      await this.dataSource.transaction(async (em) => {
        const [result] = await em.query<{ balance: number }[]>(
          `
          UPDATE wallets
          SET balance = balance - $1, updated_at = now()
          WHERE user_id = $2 AND balance >= $1
          RETURNING balance
          `,
          [amount, userId],
        );

        if (!result) {
          this.logger.error('wallet.debit.insufficient', {
            jobId: job.id,
            userId,
            amount,
            reference,
            redisBalance: newBalance,
          });
          return;
        }

        await em.query(
          `
          INSERT INTO wallet_transactions (user_id, type, amount, reference, status)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (reference) DO NOTHING
          `,
          [
            userId,
            WalletTransactionType.DEBIT,
            amount,
            reference,
            WalletTransactionStatus.SUCCESS,
          ],
        );

        this.logger.log('wallet.debit.synced', {
          jobId: job.id,
          userId,
          reference,
          dbBalance: result.balance,
          redisBalance: newBalance,
          drift: result.balance - newBalance,
        });
      });
    } catch (err: unknown) {
      console.error('wallet.debit.failed', {
        jobId: job.id,
        userId,
        reference,
        err,
      });
      throw err;
    }
  }
}
