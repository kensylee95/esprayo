import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
} from 'typeorm'

export enum WalletTransactionType {
  CREDIT = 'credit',
  DEBIT = 'debit',
  TRANSFER = 'transfer',
  WITHDRAWAL = 'withdrawal',
}

export enum WalletTransactionStatus {
  SUCCESS = 'success',
  PENDING = 'pending',
  FAILED = 'failed',
}

@Entity({ name: 'wallet_transactions' })
export class WalletTransaction {
  constructor(partial?: Partial<WalletTransaction>) {
    Object.assign(this, partial)
  }

  // -------------------------
  // PRIMARY KEY
  // -------------------------
  @PrimaryGeneratedColumn('uuid')
  id: string

  // -------------------------
  // USER
  // -------------------------
  @Index()
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string

  // -------------------------
  // TRANSACTION TYPE
  // -------------------------
  @Column({
    type: 'enum',
    enum: WalletTransactionType,
  })
  type: WalletTransactionType

  // -------------------------
  // AMOUNT
  // -------------------------
  @Column({ type: 'int' })
  amount: number

  // -------------------------
  // STATUS
  // -------------------------
  @Column({
    type: 'enum',
    enum: WalletTransactionStatus,
    default: WalletTransactionStatus.SUCCESS,
  })
  status: WalletTransactionStatus

  // -------------------------
  // UNIQUE REFERENCE (IDEMPOTENCY KEY)
  // -------------------------
  @Index({ unique: true })
  @Column({ type: 'varchar', unique: true })
  reference: string

  // -------------------------
  // EXTRA DATA (GIFT INFO, PAYSTACK RESPONSE, ETC)
  // -------------------------
  @Column({ type: 'json', nullable: true })
  meta: Record<string, any> | null

  // -------------------------
  // TIMESTAMP
  // -------------------------
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date
}