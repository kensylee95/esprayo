import { GiftServiceModule } from "@modules/gift/gift.module";
import { LeaderboardServiceModule } from "@modules/leaderboard/leaderboard.module";
import { WalletModule } from "@modules/wallet/wallet.module";
import { Module } from "@nestjs/common";
import { GiftController } from "./gift.controller";


@Module({
  imports: [GiftServiceModule, LeaderboardServiceModule, WalletModule],
  controllers: [GiftController],
})
export class GiftControllerModule {}
