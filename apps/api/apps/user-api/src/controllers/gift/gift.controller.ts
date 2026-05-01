import { Controller, Post, Get, Body, Param, Query } from '@nestjs/common';

import { GiftService } from '@modules/gift/gift.service';
import { CurrentUser, Public } from '@modules/auth/src';

// -------------------------
// DTOs
// -------------------------
class SendGiftDto {
  eventId: string;
  giftId: string;
  displayName: string;
}

class TopUpDto {
  tokens: number;
  paymentReference: string;
}

@Controller('gift-room')
export class GiftController {
  constructor(private readonly giftService: GiftService) {}

  // -------------------------
  // SEND GIFT
  // -------------------------
  @Post('gift')
  async sendGift(@Body() dto: SendGiftDto, @CurrentUser('id') userId: string) {
    const catalog = this.giftService.getGiftCatalog();

    const item = catalog.find((g) => g.id === dto.giftId);

    if (!item) {
      throw new Error('Gift not found');
    }

    return this.giftService.sendGift({
      eventId: dto.eventId,
      userId,
      displayName: dto.displayName,
      giftId: item.id,
      giftName: item.name,
      giftEmoji: item.emoji,
      tokens: item.tokens,
      amount: item.tokens,
      reference: `gift_${dto.eventId}_${Date.now()}`,
    });
  }

  // -------------------------
  // LEADERBOARD
  // -------------------------
  @Public()
  @Get(':eventId/leaderboard')
  async getLeaderboard(
    @Param('eventId') eventId: string,
    @Query('limit') limit = 20,
  ) {
    return this.giftService.getLeaderBoard(eventId, limit);
  }

  // -------------------------
  // GIFT CATALOG
  // -------------------------
  @Public()
  @Get('catalog')
  getCatalog() {
    return this.giftService.getGiftCatalog();
  }

  // -------------------------
  // WALLET BALANCE
  // -------------------------
  @Get('wallet')
  async getWallet(@CurrentUser('id') userId: string) {
    const balance = await this.giftService.getWalletBalance(userId);
    return { balance };
  }

  // -------------------------
  // TOPUP (FROM PAYMENT WEBHOOK)
  // -------------------------
  @Post('wallet/topup')
  async topUp(@Body() dto: TopUpDto, @CurrentUser('id') userId: string) {
    const newBalance = await this.giftService.creditUserAccount(
      userId,
      dto.tokens,
      dto.paymentReference,
    );

    return { newBalance };
  }
}
