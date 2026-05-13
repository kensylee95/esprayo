import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { DEFAULT_REDIS, RedisService } from '@liaoliaots/nestjs-redis';
import Redis from 'ioredis';

import { Wallet } from '@modules/wallet/entities/wallet.entity';
import {
  WalletTransaction,
  WalletTransactionType,
  WalletTransactionStatus,
} from '@modules/wallet/entities/wallet-transaction.entity';

@Injectable()
export class WalletService {
  private readonly redis: Redis;

  constructor(
    private readonly redisService: RedisService,

    @InjectRepository(Wallet)
    private readonly walletRepository: Repository<Wallet>,

    private readonly dataSource: DataSource,
  ) {
    this.redis = this.redisService.getOrThrow(DEFAULT_REDIS);
  }

  // -------------------------
  // MAPPER
  // -------------------------
  private mapWallet(wallet: Wallet) {
    return {
      id: wallet.id,
      userId: wallet.userId,
      balance: wallet.balance,
      createdAt: wallet.createdAt,
      updatedAt: wallet.updatedAt,
    };
  }

  // -------------------------
  // REDIS KEY
  // -------------------------
  private balanceKey(userId: string) {
    return `wallet:${userId}:balance`;
  }

  // -------------------------
  // CREATE WALLET
  // -------------------------
  async createWallet(userId: string): Promise<Wallet> {
    const existing = await this.walletRepository.findOne({
      where: { userId },
    });

    if (existing) {
      return existing;
    }

    const wallet = this.walletRepository.create({
      userId,
      balance: 0,
    });

    await this.walletRepository.save(wallet);
    await this.redis.set(this.balanceKey(userId), 0);

    return wallet;
  }

  // -------------------------
  // GET WALLET
  // -------------------------
  async getWallet(userId: string) {
    const wallet = await this.walletRepository.findOne({
      where: { userId },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    return this.mapWallet(wallet);
  }

  // -------------------------
  // GET BALANCE (CACHE → DB)
  // -------------------------
  async getBalance(userId: string): Promise<number> {
    const cached = await this.redis.get(this.balanceKey(userId));

    if (cached !== null) {
      return Number(cached);
    }

    const wallet = await this.walletRepository.findOne({
      where: { userId },
    });

    const balance = wallet?.balance ?? 0;
    await this.redis.set(this.balanceKey(userId), balance);

    return balance;
  }

  // -------------------------
  // CREDIT
  // -------------------------
  async credit(input: {
    userId: string;
    amount: number;
    reference: string;
  }): Promise<number> {
    const { userId, amount, reference } = input;

    // FIX 1: Redis update moved outside the transaction so it only runs on
    // successful commit. Previously it ran inside the callback, meaning a
    // subsequent rollback would leave Redis with a stale/wrong balance.
    const newBalance = await this.dataSource.transaction(async (manager) => {
      const wallet = await manager.findOne(Wallet, {
        where: { userId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!wallet) {
        throw new NotFoundException('Wallet not found');
      }

      wallet.balance += amount;
      await manager.save(wallet);

      // FIX 2: Transaction record written through the transaction manager so
      // it's atomic with the balance update. Previously used the injected
      // txRepository which is outside the DB transaction — a failure there
      // would leave the balance changed but unrecorded.
      await manager.save(WalletTransaction, {
        userId,
        type: WalletTransactionType.CREDIT,
        amount,
        reference,
        status: WalletTransactionStatus.SUCCESS,
      });

      return wallet.balance;
    });

    await this.redis.set(this.balanceKey(userId), newBalance);
    return newBalance;
  }

  // -------------------------
  // DEBIT
  // -------------------------
async debit(input: {
  userId: string;
  amount: number;
  reference: string;
}): Promise<number> {
  const { userId, amount, reference } = input;

  const t0 = performance.now();

  // DB
  const tSql = performance.now();

  const result = await this.dataSource.query(
    `
    WITH updated AS (
      UPDATE wallets
      SET balance = balance - $1
      WHERE user_id = $2
      AND balance >= $1
      RETURNING user_id, balance
    )
    INSERT INTO wallet_transactions
      (user_id, type, amount, reference, status)
    SELECT
      user_id,
      $3,
      $1,
      $4,
      $5
    FROM updated
    RETURNING (
      SELECT balance FROM updated
    ) AS balance;
    `,
    [
      amount,
      userId,
      WalletTransactionType.DEBIT,
      reference,
      WalletTransactionStatus.SUCCESS,
    ],
  );

  console.log(
    `wallet.sql: ${(performance.now() - tSql).toFixed(2)}ms`,
  );

  if (!result.length) {
    throw new BadRequestException(
      'Insufficient balance or wallet not found',
    );
  }

  const newBalance = result[0].balance;

  // Redis
  const tRedis = performance.now();

  void this.redis.set(
    this.balanceKey(userId),
    newBalance,
  );

   console.log(
    `wallet.redis.schedule: ${(performance.now() - tRedis).toFixed(2)}ms`,
  );

   console.log(
    `wallet.total: ${(performance.now() - t0).toFixed(2)}ms`,
  );

  return newBalance;
}
  // -------------------------
  // TRANSFER (GIFTING)
  // -------------------------
  async transfer(input: {
    fromUserId: string;
    toUserId: string;
    amount: number;
    reference: string;
  }): Promise<boolean> {
    const { fromUserId, toUserId, amount, reference } = input;

    // FIX 3: Deadlock prevention — always acquire locks in a consistent
    // alphabetical order regardless of which direction the transfer flows.
    // Without this, two concurrent A→B and B→A transfers will deadlock:
    // each holds one lock and waits for the other indefinitely.
    const [firstId, secondId] = [fromUserId, toUserId].sort();

    const { senderBalance, receiverBalance } =
      await this.dataSource.transaction(async (manager) => {
        const firstWallet = await manager.findOne(Wallet, {
          where: { userId: firstId },
          lock: { mode: 'pessimistic_write' },
        });

        const secondWallet = await manager.findOne(Wallet, {
          where: { userId: secondId },
          lock: { mode: 'pessimistic_write' },
        });

        if (!firstWallet || !secondWallet) {
          throw new NotFoundException('Wallet not found');
        }

        const sender = firstId === fromUserId ? firstWallet : secondWallet;
        const receiver = firstId === fromUserId ? secondWallet : firstWallet;

        if (sender.balance < amount) {
          throw new BadRequestException('Insufficient balance');
        }

        sender.balance -= amount;
        receiver.balance += amount;

        await manager.save([sender, receiver]);

        // FIX 2: Both transaction records written through manager so they're
        // atomic with the balance updates.
        await manager.save(WalletTransaction, [
          {
            userId: fromUserId,
            type: WalletTransactionType.DEBIT,
            amount,
            reference,
            status: WalletTransactionStatus.SUCCESS,
          },
          {
            userId: toUserId,
            type: WalletTransactionType.CREDIT,
            amount,
            reference,
            status: WalletTransactionStatus.SUCCESS,
          },
        ]);

        return {
          senderBalance: sender.balance,
          receiverBalance: receiver.balance,
        };
      });

    // FIX 1: Redis updates after commit, not inside the transaction.
    // FIX 4: mset batches both writes into one round trip instead of two
    // serial awaits.
    await this.redis.mset(
      this.balanceKey(fromUserId),
      senderBalance,
      this.balanceKey(toUserId),
      receiverBalance,
    );

    return true;
  }

  // -------------------------
  // SYNC CACHE
  // -------------------------
  async syncWallet(userId: string) {
    const wallet = await this.walletRepository.findOne({
      where: { userId },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    await this.redis.set(this.balanceKey(userId), wallet.balance);
  }
}
