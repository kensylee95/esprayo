import { Module } from "@nestjs/common";
import { GiftService } from "./gift.service";
import { LeaderboardServiceModule } from "@modules/leaderboard/leaderboard.module";
import { GiftProcessor } from "./gift.processor";
import { WalletModule } from "@modules/wallet/wallet.module";
import { BullModule } from "@nestjs/bullmq";

@Module({
  imports: [
    LeaderboardServiceModule, 
    WalletModule,
     BullModule.registerQueue({
      name: 'gifts',
    }),
  ],
  providers: [GiftService, GiftProcessor],
  exports: [GiftService, GiftProcessor],
})
export class GiftServiceModule {}