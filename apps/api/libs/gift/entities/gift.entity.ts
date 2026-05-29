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

  @Column('uuid', { nullable: true })
  guestId: string;

  @Column({ type: 'uuid' })
  @Index({ unique: true })
  transactionId: string;

  @Column({
    type: 'varchar',
    length: 120,
  })
  displayName: string;

  @Column({
    type: 'varchar',
    length: 50,
  })
  denomination: string;

  @Column({
    type: 'int',
  })
  nairaValue: number;

  @Column({
    type: 'int',
    default: 1,
  })
  quantity: number;

  @Column({
    type: 'varchar',
    length: 50,
    default: 'spray',
  })
  giftType: string;

  @Column({
    type: 'varchar',
    length: 10,
    default: 'NGN',
  })
  currency: string;

  @Column({
    type: 'int',
    default: 0,
  })
  cumulativeTokens: number;

  @Column({
    type: 'int',
    nullable: true,
  })
  rankAtTime: number;

  @Column({
    type: 'jsonb',
    nullable: true,
  })
  metadata?: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}
