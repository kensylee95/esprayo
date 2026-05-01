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

    @InjectRepository(WalletTransaction)
    private readonly txRepository: Repository<WalletTransaction>,

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

    return this.dataSource.transaction(async (manager) => {
      const wallet = await manager.findOne(Wallet, {
        where: { userId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!wallet) {
        throw new NotFoundException('Wallet not found');
      }

      wallet.balance += amount;
      await manager.save(wallet);

      await this.txRepository.save({
        userId,
        type: WalletTransactionType.CREDIT,
        amount,
        reference,
        status: WalletTransactionStatus.SUCCESS,
      });

      await this.redis.set(this.balanceKey(userId), wallet.balance);

      return wallet.balance;
    });
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

    return this.dataSource.transaction(async (manager) => {
      const wallet = await manager.findOne(Wallet, {
        where: { userId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!wallet) {
        throw new NotFoundException('Wallet not found');
      }

      if (wallet.balance < amount) {
        throw new BadRequestException('Insufficient balance');
      }

      wallet.balance -= amount;
      await manager.save(wallet);

      await this.txRepository.save({
        userId,
        type: WalletTransactionType.DEBIT,
        amount,
        reference,
        status: WalletTransactionStatus.SUCCESS,
      });

      await this.redis.set(this.balanceKey(userId), wallet.balance);

      return wallet.balance;
    });
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

    return this.dataSource.transaction(async (manager) => {
      const sender = await manager.findOne(Wallet, {
        where: { userId: fromUserId },
        lock: { mode: 'pessimistic_write' },
      });

      const receiver = await manager.findOne(Wallet, {
        where: { userId: toUserId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!sender || !receiver) {
        throw new NotFoundException('Wallet not found');
      }

      if (sender.balance < amount) {
        throw new BadRequestException('Insufficient balance');
      }

      sender.balance -= amount;
      receiver.balance += amount;

      await manager.save([sender, receiver]);

      await this.txRepository.save([
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

      await this.redis.set(this.balanceKey(fromUserId), sender.balance);
      await this.redis.set(this.balanceKey(toUserId), receiver.balance);

      return true;
    });
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
