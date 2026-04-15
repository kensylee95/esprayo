import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { GiftService } from '@modules/gift/gift.service';
import { LeaderboardService } from '@modules/leaderboard/leaderboardmodule.service';
import { WalletService } from '@modules/wallet/wallet.service';
import { CurrentUser, Public } from '@modules/auth/src';

class SendGiftDto {
  eventId: string;
  giftId: string;
  displayName: string;
}

class TopUpDto {
  tokens: number;
  paymentReference: string; // from Paystack/Flutterwave webhook
}

@Controller('gift-room')
export class GiftController {
  constructor(
    private readonly giftService: GiftService,
    private readonly leaderboardService: LeaderboardService,
    private readonly walletService: WalletService,
  ) {}

  /** Send a gift */
  @Post('gift')
  async sendGift(@Body() dto: SendGiftDto, @CurrentUser("id") userId: string) {
    const catalog = await this.giftService.getGiftCatalog(dto.eventId);
    const item = catalog.find((g) => g.id === dto.giftId);
    if (!item) throw new Error('Gift not found');

    return this.giftService.sendGift({
      eventId: dto.eventId,
      userId: userId,
      displayName: dto.displayName,
      giftId: item.id,
      giftName: item.name,
      giftEmoji: item.emoji,
      tokens: item.tokens,
    });
  }

  /** Get leaderboard */
  @Public()
  @Get(':eventId/leaderboard')
  async getLeaderboard(
    @Param('eventId') eventId: string,
    @Query('limit') limit = 20,
  ) {
    const [leaderboard, totalTokens] = await Promise.all([
      this.leaderboardService.getTop(eventId, +limit),
      this.leaderboardService.getTotalTokens(eventId),
    ]);
    return { leaderboard, totalTokens };
  }
  
  @Public()
  /** Get gift catalog */
  @Get('catalog')
  async getCatalog() {
    return this.giftService.getGiftCatalog();
  }

  /** Get wallet balance */
  @Get('wallet')
  async getWallet( @CurrentUser("id") userId: string) {
    const balance = await this.walletService.getBalance(userId);
    return { balance };
  }

  @Post('wallet/topup')
  async topUp(@Body() dto: TopUpDto, @CurrentUser("id") userId: string) {
    const newBalance = await this.walletService.topUp(userId, dto.tokens);
    await this.walletService.recordTopUp(
      userId,
      dto.tokens,
      dto.paymentReference,
    );
    return { newBalance };
  }
}