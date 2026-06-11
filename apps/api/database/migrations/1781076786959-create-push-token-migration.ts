import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableIndex,
  TableForeignKey,
} from 'typeorm';

export class CreatePushSubscriptionMigration1781076786959
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'push_subscriptions',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'endpoint',
            type: 'varchar',
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'p256dh',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'auth',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'device',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'push_subscriptions',
      new TableIndex({
        name: 'IDX_PUSH_SUBSCRIPTION_USER_ID',
        columnNames: ['user_id'],
      }),
    );

    await queryRunner.createForeignKey(
      'push_subscriptions',
      new TableForeignKey({
        name: 'FK_PUSH_SUBSCRIPTION_USER',
        columnNames: ['user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey(
      'push_subscriptions',
      'FK_PUSH_SUBSCRIPTION_USER',
    );
    await queryRunner.dropIndex(
      'push_subscriptions',
      'IDX_PUSH_SUBSCRIPTION_USER_ID',
    );
    await queryRunner.dropTable('push_subscriptions');
  }
}