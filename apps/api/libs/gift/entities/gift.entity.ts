import { Event } from '@modules/event/entities/event.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('gifts')
@Index(['eventId', 'createdAt'])
@Index(['eventId', 'guestId'])
@Index(['transactionId'], { unique: true })
export class Gift {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column('uuid')
  @Index()
  eventId: string;

  @ManyToOne(() => Event, (event) => event.gifts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'eventId' })
  event: Event;

  /** Authenticated user id — nullable for anonymous gifts */
  @Column('uuid', { nullable: true })
  guestId: string;

  /** Unique id for idempotency (prevents duplicate processing) */
  @Column({ type: 'uuid' })
  @Index({ unique: true })
  transactionId: string;

  /** Display name chosen at gift time */
  @Column({ length: 60 })
  displayName: string;

  @Column({ length: 40 })
  giftId: string;

  @Column({ length: 80 })
  giftName: string;

  @Column({ length: 10 })
  giftEmoji: string;

  @Column({ type: 'int' })
  tokens: number;

  /** Naira value locked at time of gift (tokenRateNaira × tokens) */
  @Column({ type: 'int' })
  nairaValue: number;

  /** Leaderboard score snapshot after this gift */
  @Column({ type: 'int', default: 0 })
  cumulativeTokens: number;

  /** Rank on the leaderboard at the time of this gift */
  @Column({ type: 'int', nullable: true })
  rankAtTime: number;

  @CreateDateColumn()
  createdAt: Date;
}
