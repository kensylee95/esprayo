export enum EventStatus {
  DRAFT = "draft",
  ACTIVE = "active",
  ENDED = "ended",
  CANCELLED = "cancelled",
}

export enum EventType {
  WEDDING = "wedding",
  BIRTHDAY = "birthday",
  GRADUATION = "graduation",
  ANNIVERSARY = "anniversary",
  NAMING = "naming",
  OTHER = "other",
}

export const RECENT_EVENT_IDS_KEY = "recent_event_ids";
export const MAX_RECENT = 5;

export interface RecentEvent {
  id: string;
  title: string;
  code: string;
  emoji: string;
  gifterCount: number;
  status: "live" | "draft";
  lastViewedAt: number;
}

export interface IEvent {
  id: string;
  slug: string;
  title: string;
  description: string | null; // @Column({ type: 'text', nullable: true })
  type: EventType;
  status: EventStatus;
  hostId: string;
  venue: string | null; // @Column({ length: 200, nullable: true })
  startsAt: Date;
  endsAt: Date;
  tokenBalance: number; // bigint in PG — use Number() when reading
  nairaBalance: number; // bigint in PG — use Number() when reading
  giftCount: number;
  gifterCount: number;
  tokenRateNaira: number;
  showNairaValues: boolean;
  coverImageUrl: string | null; // @Column({ nullable: true })
  welcomeMessage: string | null; // @Column({ type: 'text', nullable: true })
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

// ─── Service params ───────────────────────────────────────────────────────────

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

export interface TopGifter {
  displayName: string;
  total: number;
}

export interface EventStats {
  tokenBalance: number;
  nairaBalance: number;
  giftCount: number;
  gifterCount: number;
  topGifter: TopGifter | null;
  recentGifts: IGift[];
}

// ─── Redis hash shapes ────────────────────────────────────────────────────────
// All values are strings — ioredis does not accept enum types directly.
// Cast EventStatus to string at call sites.

export interface EventRedisHash {
  title: string;
  hostId: string;
  status: string; // EventStatus cast to string for ioredis
  slug: string;
  tokenBalance: string; // bigint stored as string — parse with Number()
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

export type CreateEventResponse = IEvent;

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

// ─── Branded slug ─────────────────────────────────────────────────────────────
// Prevents accidentally passing a plain eventId where a slug is expected.

export type EventSlug = string & { readonly __brand: "EventSlug" };

export function brandSlug(raw: string): EventSlug {
  return raw as EventSlug;
}
