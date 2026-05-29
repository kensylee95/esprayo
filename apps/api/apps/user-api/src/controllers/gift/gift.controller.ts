import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { GiftService } from '@modules/gift/gift.service';
import { CurrentUser, Public } from '@modules/auth/src';
import { randomUUID } from 'crypto';
import { NairaDenomination } from '@modules/gift/dtos/gift.dto';

// -------------------------
// DTOs
// -------------------------
class SendGiftDto {
  eventId: string;
  amount: number;
  displayName: string;
  tokens: number;
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
    const allowed = [50, 100, 200, 500, 1000];

    if (!allowed.includes(dto.amount)) {
      throw new BadRequestException('Invalid amount');
    }
    const denomination = String(dto.amount) as NairaDenomination;

    return this.giftService.sendGift({
      eventId: dto.eventId,
      userId,
      denomination: denomination,
      displayName: dto.displayName,
      amount: dto.amount,
      reference: `gift_${dto.eventId}_${randomUUID()}`,
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
