import { EventStatus, EventType } from "../entities/event.entity";


export interface EventCreateDTO{
  title: string;
  description?: string | undefined;
  type: EventType;
  welcomeMessage?: string;
}
export interface IEvent {
  id: string;
  slug: string;
  title: string;
  description: string | undefined;
  type: EventType;
  status: EventStatus;
  hostId: string;
  venue: string | undefined;
  startsAt: Date;
  endsAt: Date;

  // balances
  tokenBalance: number;
  nairaBalance: number;
  giftCount: number;
  gifterCount: number;
  tokenRateNaira: number;

  // display
  showNairaValues: boolean;
  coverImageUrl: string | undefined;
  welcomeMessage: string | undefined;

  createdAt: Date;
  updatedAt: Date;
}

export interface IGift {
  id: string;
  eventId: string;
  guestId: string | null;
  displayName: string;
  giftId: string;
  giftName: string;
  giftEmoji: string;
  tokens: number;
  nairaValue: number;
  cumulativeTokens: number;
  rankAtTime: number | null;
  createdAt: Date;
}

export interface ApplyGiftParams {
  eventId: string;
  guestId: string | null;
  displayName: string;
  giftId: string;
  giftName: string;
  giftEmoji: string;
  tokens: number;
  cumulativeTokens: number;
  rankAtTime: number;
  isNewGifter: boolean;
}

export interface ApplyGiftResult {
  event: IEvent;
  gift: IGift;
}

// ─── Service return shapes ────────────────────────────────────────────────────

export interface EventStats {
  tokenBalance: number;
  nairaBalance: number;
  giftCount: number;
  gifterCount: number;
  topGifter: TopGifter | null;
  recentGifts: IGift[];
}

export interface TopGifter {
  displayName: string;
  total: number;
}

// ─── Redis hash shapes ────────────────────────────────────────────────────────
// These mirror exactly what is stored in Redis so hgetall results can be
// cast without guessing field names.

export interface EventRedisHash {
  title: string;
  hostId: string;
  status: EventStatus;
  slug: string;
  tokenBalance: string;   // stored as string — parse with Number()
  nairaBalance: string;
  giftCount: string;
  gifterCount: string;
}

export interface EventBalanceRedisUpdate {
  tokenBalance: string;
  nairaBalance: string;
  giftCount: string;
  gifterCount: string;
}

// ─── Controller response shapes ───────────────────────────────────────────────

export interface CreateEventResponse extends IEvent {}

export interface ActivateEventResponse {
  id: string;
  status: EventStatus;
  slug: string;
  startsAt: Date;
  endsAt: Date;
}

export interface EndEventResponse {
  id: string;
  status: EventStatus;
  tokenBalance: number;
  nairaBalance: number;
  giftCount: number;
  gifterCount: number;
}

// ─── Slug generation ──────────────────────────────────────────────────────────

export type EventSlug = string & { readonly __brand: 'EventSlug' };

export function brandSlug(raw: string): EventSlug {
  return raw as EventSlug;
}