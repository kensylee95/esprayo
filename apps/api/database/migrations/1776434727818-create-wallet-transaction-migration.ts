import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableIndex,
} from 'typeorm'

export class CreateWalletTransactionMigration1776434727818
  implements MigrationInterface
{
  public async up(
    queryRunner: QueryRunner,
  ): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'wallet_transactions',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },

          // Who owns this transaction
          {
            name: 'user_id',
            type: 'uuid',
          },

          // credit | debit | transfer | withdrawal
          {
            name: 'type',
            type: 'varchar',
          },

          // Amount of tokens
          {
            name: 'amount',
            type: 'int',
          },

          // success | pending | failed
          {
            name: 'status',
            type: 'varchar',
            default: `'success'`,
          },

          // Unique reference (VERY IMPORTANT for idempotency)
          {
            name: 'reference',
            type: 'varchar',
            isUnique: true,
          },

          // Optional metadata (gift info, paystack response, etc)
          {
            name: 'meta',
            type: 'json',
            isNullable: true,
          },

          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
    )

    // -------------------------
    // INDEXES (PERFORMANCE)
    // -------------------------

    await queryRunner.createIndex(
      'wallet_transactions',
      new TableIndex({
        name: 'IDX_wallet_transactions_user_id',
        columnNames: ['user_id'],
      }),
    )

    await queryRunner.createIndex(
      'wallet_transactions',
      new TableIndex({
        name: 'IDX_wallet_transactions_reference',
        columnNames: ['reference'],
        isUnique: true,
      }),
    )

    await queryRunner.createIndex(
      'wallet_transactions',
      new TableIndex({
        name: 'IDX_wallet_transactions_created_at',
        columnNames: ['created_at'],
      }),
    )
  }

  public async down(
    queryRunner: QueryRunner,
  ): Promise<void> {
    await queryRunner.dropTable(
      'wallet_transactions',
    )
  }
}