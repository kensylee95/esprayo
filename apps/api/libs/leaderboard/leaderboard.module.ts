import { Module } from "@nestjs/common";
import { LeaderboardService } from "./leaderboardmodule.service";

@Module({
  providers: [LeaderboardService],
  exports: [LeaderboardService],
})
export class LeaderboardServiceModule {}