import { request } from "@/helpers/request";
import type {
  CreditDto,
  DebitDto,
  TransferDto,
  WalletResponse,
} from "./Wallet.dto";

const walletService = (token?: string) => ({
  // CREATE WALLET
  createWallet(): Promise<WalletResponse> {
    return request("/wallet", {
      method: "POST",
      token,
    });
  },

  // GET WALLET
  getWallet(): Promise<WalletResponse> {
    return request("/wallet", { token });
  },

  // GET BALANCE
  getBalance(): Promise<number> {
    return request("/wallet/balance", { token });
  },

  // CREDIT WALLET
  credit(payload: CreditDto): Promise<{ message: string; balance: number }> {
    return request("/wallet/credit", {
      method: "POST",
      body: JSON.stringify(payload),
      token,
    });
  },

  // DEBIT WALLET
  debit(payload: DebitDto): Promise<{ message: string; balance: number }> {
    return request("/wallet/debit", {
      method: "POST",
      body: JSON.stringify(payload),
      token,
    });
  },

  // TRANSFER FUNDS
  transfer(payload: TransferDto): Promise<{ message: string }> {
    return request("/wallet/transfer", {
      method: "POST",
      body: JSON.stringify(payload),
      token,
    });
  },

  // SYNC WALLET CACHE
  syncWallet(): Promise<{ message: string }> {
    return request("/wallet/sync", {
      method: "POST",
      token,
    });
  },
});

export default walletService;
