import { MigrationInterface, QueryRunner, Table, TableIndex } from "typeorm";

export class CreateGiftMigration1776505393882 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "gifts",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
            generationStrategy: "uuid",
            default: "uuid_generate_v4()",
          },

          {
            name: "eventId",
            type: "uuid",
          },

          {
            name: "guestId",
            type: "uuid",
            isNullable: true,
          },

          {
            name: "transactionId",
            type: "uuid",
          },

          {
            name: "displayName",
            type: "varchar",
            length: "60",
          },

          {
            name: "giftId",
            type: "varchar",
            length: "40",
          },

          {
            name: "giftName",
            type: "varchar",
            length: "80",
          },

          {
            name: "giftEmoji",
            type: "varchar",
            length: "10",
          },

          {
            name: "tokens",
            type: "int",
          },

          {
            name: "nairaValue",
            type: "int",
          },

          {
            name: "cumulativeTokens",
            type: "int",
            default: 0,
          },

          {
            name: "rankAtTime",
            type: "int",
            isNullable: true,
          },

          {
            name: "createdAt",
            type: "timestamptz",
            default: "now()",
          },
        ],

        foreignKeys: [
          {
            columnNames: ["eventId"],
            referencedTableName: "events",
            referencedColumnNames: ["id"],
            onDelete: "CASCADE",
          },
        ],
      })
    );

    // ─────────────────────────────
    // INDEXES
    // ─────────────────────────────

    await queryRunner.createIndex(
      "gifts",
      new TableIndex({
        name: "IDX_gifts_event_createdAt",
        columnNames: ["eventId", "createdAt"],
      })
    );

    await queryRunner.createIndex(
      "gifts",
      new TableIndex({
        name: "IDX_gifts_event_guest",
        columnNames: ["eventId", "guestId"],
      })
    );

    await queryRunner.createIndex(
      "gifts",
      new TableIndex({
        name: "UQ_gifts_transactionId",
        columnNames: ["transactionId"],
        isUnique: true,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("gifts");
  }
}