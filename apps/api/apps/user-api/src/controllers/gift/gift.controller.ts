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
import { SendGiftDto, TopUpDto } from './gift.dto';

@Controller('gift-room')
export class GiftController {
  constructor(private readonly giftService: GiftService) {}

  // -------------------------
  // SEND GIFT
  // -------------------------
  @Post('gift')
  async sendGift(@Body() dto: SendGiftDto, @CurrentUser('id') userId: string) {
    const allowed = [50, 100, 200, 500, 1000];

    if (!allowed.includes(dto.denomination)) {
      throw new BadRequestException('Invalid denomination');
    }

    if (dto.amount <= 0) {
      throw new BadRequestException('Invalid amount');
    }

    if (dto.amount % Number(dto.denomination) !== 0) {
      throw new BadRequestException(
        'Amount must be a multiple of the selected denomination',
      );
    }
    return this.giftService.sendGift({
      eventId: dto.eventId,
      userId,
      denomination: String(dto.denomination) as NairaDenomination,
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
