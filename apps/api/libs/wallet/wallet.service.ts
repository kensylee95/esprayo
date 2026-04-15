import { Injectable, BadRequestException } from '@nestjs/common';
import { DEFAULT_REDIS, RedisService } from '@liaoliaots/nestjs-redis';
import Redis from 'ioredis';

@Injectable()
export class WalletService {
 private readonly redis: Redis;

  constructor(private readonly redisService: RedisService) {
    this.redis = this.redisService.getOrThrow(DEFAULT_REDIS);
  }

  private key(userId: string) {
    return `wallet:${userId}`;
  }

  async getBalance(userId: string): Promise<number> {
    const val = await this.redis.hget(this.key(userId), 'balance');
    return parseInt(val ?? '0', 10);
  }

  async topUp(userId: string, tokens: number): Promise<number> {
    const newBalance = await this.redis.hincrby(
      this.key(userId),
      'balance',
      tokens,
    );
    return newBalance;
  }

  /**
   * Atomic debit using a Lua script so there's no race between
   * reading the balance and subtracting it.
   */
  async debit(userId: string, tokens: number): Promise<number> {
    const lua = `
      local key = KEYS[1]
      local amount = tonumber(ARGV[1])
      local balance = tonumber(redis.call('HGET', key, 'balance') or 0)
      if balance < amount then
        return -1
      end
      return redis.call('HINCRBY', key, 'balance', -amount)
    `;

    const result = await this.redis.eval(lua, 1, this.key(userId), tokens);

    if (result === -1) {
      throw new BadRequestException('Insufficient token balance');
    }

    return result as number;
  }

  /**
   * Record a top-up transaction for audit purposes.
   * Stored as a Redis list, trimmed to the last 100 entries.
   */
  async recordTopUp(
    userId: string,
    tokens: number,
    reference: string,
  ): Promise<void> {
    const txKey = `wallet:${userId}:tx`;
    const entry = JSON.stringify({
      type: 'topup',
      tokens,
      reference,
      ts: Date.now(),
    });
    const pipeline = this.redis.pipeline();
    pipeline.lpush(txKey, entry);
    pipeline.ltrim(txKey, 0, 99);
    await pipeline.exec();
  }
}