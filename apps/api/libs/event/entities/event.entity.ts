import { Gift } from '@modules/gift/entities/gift.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
 
export enum EventStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  ENDED = 'ended',
  CANCELLED = 'cancelled',
}
 
export enum EventType {
  WEDDING = 'wedding',
  BIRTHDAY = 'birthday',
  GRADUATION = 'graduation',
  ANNIVERSARY = 'anniversary',
  NAMING = 'naming',
  OTHER = 'other',
}
 
@Entity('events')
@Index(['hostId', 'status'])
@Index(['slug'], { unique: true })
export class Event {
  @PrimaryGeneratedColumn('uuid')
  id: string;
 
  /** Short unique code guests use to join — e.g. ADC2025 */
  @Column({ unique: true, length: 20 })
  slug: string;
 
  @Column({ length: 120 })
  title: string;
 
  @Column({ type: 'text', nullable: true })
  description: string;
 
  @Column({ type: 'enum', enum: EventType, default: EventType.OTHER })
  type: EventType;
 
  @Column({ type: 'enum', enum: EventStatus, default: EventStatus.DRAFT })
  status: EventStatus;
 
  /** The user who created the event */
  @Column('uuid')
  @Index()
  hostId: string;
 
  /** Venue or location label */
  @Column({ length: 200, nullable: true })
  venue: string;
 
  @Column({ type: 'timestamptz' })
  startsAt: Date;
 
  @Column({ type: 'timestamptz' })
  endsAt: Date;
 
  // ─── Financial fields ────────────────────────────────────────────────────
 
  /**
   * Running total of tokens gifted at this event.
   * Updated atomically via PostgreSQL FOR UPDATE or optimistic locking.
   */
  @Column({ type: 'bigint', default: 0 })
  tokenBalance: number;
 
  /**
   * Naira equivalent — computed as tokenBalance × tokenRate at time of gift.
   * Stored for reporting; recalculable if needed.
   */
  @Column({ type: 'bigint', default: 0 })
  nairaBalance: number;
 
  /** Total number of individual gifts received */
  @Column({ type: 'int', default: 0 })
  giftCount: number;
 
  /** Number of unique gifters */
  @Column({ type: 'int', default: 0 })
  gifterCount: number;
 
  /** Naira value per token — set at event creation, immutable after */
  @Column({ type: 'int', default: 10 })
  tokenRateNaira: number;
 
  // ─── Display settings ────────────────────────────────────────────────────
 
  /** Whether the display screen shows naira values */
  @Column({ default: true })
  showNairaValues: boolean;
 
  /** Cover image URL (uploaded by host) */
  @Column({ nullable: true })
  coverImageUrl: string;

  /** Custom welcome message shown in the gift room */
  @Column({ type: 'text', nullable: true })
  welcomeMessage: string;
 
  @CreateDateColumn()
  createdAt: Date;
 
  @UpdateDateColumn()
  updatedAt: Date;
 
  @OneToMany(() => Gift, (gift) => gift.event)
  gifts: Gift[];
}


