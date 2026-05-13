import { Module } from '@nestjs/common';
import { LeaderboardService } from './leaderboard.service';
import { RedisProviderModule } from '@modules/redis/redis.module';

@Module({
  imports: [RedisProviderModule],
  providers: [LeaderboardService],
  exports: [LeaderboardService],
})
export class LeaderboardServiceModule {}
