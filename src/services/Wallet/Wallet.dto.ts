export type CreditDto = {
  amount: number;
  reference: string;
};

export type DebitDto = {
  amount: number;
  reference: string;
};

export type TransferDto = {
  toUserId: string;
  amount: number;
  reference: string;
};

export type WalletResponse = {
  id: string;
  userId: string;
  balance: number;
  createdAt: string;
  updatedAt: string;
};
