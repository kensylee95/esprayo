import { MigrationInterface, QueryRunner } from "typeorm";

export class AlterGiftTransactionId1778701569947 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE gifts
      ALTER COLUMN "transactionId" TYPE varchar
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE gifts
      ALTER COLUMN "transactionId" TYPE uuid USING "transactionId"::uuid
    `);
  }

}