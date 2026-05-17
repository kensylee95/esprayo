import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';

import Redis from 'ioredis';

import { Wallet } from '@modules/wallet/entities/wallet.entity';
import {
  WalletTransaction,
  WalletTransactionType,
  WalletTransactionStatus,
} from '@modules/wallet/entities/wallet-transaction.entity';
import { REDIS_CLIENT } from '@modules/redis/redis.module';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class WalletService {
  constructor(
    @Inject(REDIS_CLIENT)
    private readonly redis: Redis,
    @InjectRepository(Wallet)
    private readonly walletRepository: Repository<Wallet>,
    @InjectQueue('wallet')
    private readonly walletQueue: Queue,
    private readonly dataSource: DataSource,
  ) {}

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
    console.log('redis instance:', this.redis);
    const cached = await this.redis.get(this.balanceKey(userId));
    if (cached !== null) return Number(cached);

    const wallet = await this.walletRepository.findOne({
      where: { userId },
    });

    if (!wallet) throw new NotFoundException('Wallet not found');

    // Fire and forget — a Redis hiccup shouldn't block the balance read
    this.redis
      .set(this.balanceKey(userId), wallet.balance, 'EX', 86400)
      .catch((err: unknown) =>
        console.error('wallet.redis.set failed', { userId, err }),
      );

    return wallet.balance;
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

    const newBalance = await this.dataSource.transaction(async (manager) => {
      const wallet = await manager.findOne(Wallet, {
        where: { userId },
      });

      if (!wallet) throw new NotFoundException('Wallet not found');

      wallet.balance += amount;
      await manager.save(wallet);

      await manager.save(WalletTransaction, {
        userId,
        type: WalletTransactionType.CREDIT,
        amount,
        reference,
        status: WalletTransactionStatus.SUCCESS,
      });

      return wallet.balance;
    });

    // Fire and forget — DB is source of truth for credits
    await this.redis
      .set(this.balanceKey(userId), newBalance, 'EX', 86400)
      .catch((err: unknown) =>
        console.error('wallet.redis.set failed', { userId, err }),
      );

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

    // Atomic check-and-deduct in a single Redis round-trip
    const luaScript = `
    local balance = tonumber(redis.call('GET', KEYS[1]))
    if balance == nil then return -2 end
    if balance < tonumber(ARGV[1]) then return -1 end
    return redis.call('DECRBY', KEYS[1], ARGV[1])
  `;

    const result = (await this.redis.eval(
      luaScript,
      1,
      this.balanceKey(userId),
      amount,
    )) as number;

    if (result === -2)
      throw new BadRequestException('Wallet not found — join the room first');
    if (result === -1) throw new BadRequestException('Insufficient balance');

    // Queue DB sync — processor handles UPDATE + INSERT atomically
    void this.walletQueue.add(
      'debit',
      { userId, amount, reference, newBalance: result },
      {
        attempts: 10,
        backoff: { type: 'exponential', delay: 500 },
        removeOnComplete: true,
        removeOnFail: false,
      },
    );

    return result;
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
