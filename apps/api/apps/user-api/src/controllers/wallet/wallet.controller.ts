import { CurrentUser } from '@modules/auth/src';
import { WalletService } from '@modules/wallet/wallet.service';
import { Controller, Get, Post, Body } from '@nestjs/common';

@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  // -------------------------
  // CREATE WALLET
  // -------------------------

  // -------------------------
  // GET WALLET
  // -------------------------
  @Get()
  async getWallet(@CurrentUser('id') userId: string) {
    return this.walletService.getWallet(userId);
  }

  // -------------------------
  // GET WALLET
  // -------------------------
  @Get('balance')
  async getWalletBalance(@CurrentUser('id') userId: string) {
    return this.walletService.getBalance(userId);
  }

  // -------------------------
  // CREDIT
  // -------------------------
  @Post('credit')
  async credit(
    @CurrentUser('id') userId: string,
    @Body()
    body: {
      amount: number;
      reference: string;
    },
  ) {
    const balance = await this.walletService.credit({
      userId,
      amount: body.amount,
      reference: body.reference,
    });

    return {
      message: 'Wallet credited successfully',
      balance,
    };
  }

  // -------------------------
  // DEBIT
  // -------------------------
  @Post('debit')
  async debit(
    @CurrentUser('id') userId: string,
    @Body()
    body: {
      amount: number;
      reference: string;
    },
  ) {
    const balance = await this.walletService.debit({
      userId,
      amount: body.amount,
      reference: body.reference,
    });

    return {
      message: 'Wallet debited successfully',
      balance,
    };
  }

  // -------------------------
  // TRANSFER
  // -------------------------
  @Post('transfer')
  async transfer(
    @CurrentUser('id') userId: string,
    @Body()
    body: {
      toUserId: string;
      amount: number;
      reference: string;
    },
  ) {
    await this.walletService.transfer({
      fromUserId: userId,
      toUserId: body.toUserId,
      amount: body.amount,
      reference: body.reference,
    });

    return {
      message: 'Transfer successful',
    };
  }

  // -------------------------
  // SYNC CACHE
  // -------------------------
  @Post('sync')
  async syncWallet(@CurrentUser('id') userId: string) {
    await this.walletService.syncWallet(userId);

    return {
      message: 'Wallet cache synced',
    };
  }
}
