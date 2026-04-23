import { GiftServiceModule } from "@modules/gift/gift.module";
import { Module } from "@nestjs/common";
import { GiftController } from "./gift.controller";


@Module({
  imports: [
    GiftServiceModule
  ],
  controllers: [GiftController],
})
export class GiftControllerModule {}
