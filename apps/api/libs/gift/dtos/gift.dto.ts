export interface SaveGiftInput {
  eventId: string;

  /** user who sent the gift */
  userId: string;

  denomination: '50' | '100' | '200' | '500' | '1000';

  displayName: string;

  /** locked fiat value at time of gift */
  nairaValue: number;

  /** leaderboard score after this gift */
  cumulativeTokens?: number;

  /** rank at time of gift */
  rankAtTime?: number | undefined;

  /** optional idempotency key to prevent duplicates */
  transactionId?: string;
}
export type NairaDenomination = '50' | '100' | '200' | '500' | '1000';

export interface BroadcastGiftJob {
  transactionId: string;

  eventId: string;

  userId: string;

  displayName: string;

  denomination: NairaDenomination;

  nairaValue: number;

  quantity?: number;

  giftType?: 'spray' | 'money_rain' | 'odogwu';

  metadata?: Record<string, any>;

  createdAt?: string;
}

export interface GiftPayload {
  eventId: string;
  userId: string;
  displayName: string;
  denomination: NairaDenomination;
  amount: number;
  reference: string;
}

export interface GiftResult {
  success: boolean;
  newBalance: number;
}

export interface Denomination {
  id: string;
  label: string;
  value: number;
  color: string;
  rarity: 'common' | 'rare' | 'premium';
}

export const DENOMINATIONS: Denomination[] = [
  {
    id: 'fifty',
    label: '₦50',
    value: 50,
    color: '#5C4033',
    rarity: 'common',
  },

  {
    id: 'fiveHundred',
    label: '₦500',
    value: 500,
    color: '#2E8B57',
    rarity: 'rare',
  },

  {
    id: 'oneThousand',
    label: '₦1000',
    value: 1000,
    color: '#FFD700',
    rarity: 'premium',
  },
];
