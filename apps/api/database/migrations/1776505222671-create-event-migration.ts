import { MigrationInterface, QueryRunner, Table, TableIndex } from "typeorm";

export class CreateEventMigration1776505222671 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "events",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
            generationStrategy: "uuid",
            default: "uuid_generate_v4()",
          },

          {
            name: "slug",
            type: "varchar",
            length: "20",
            isUnique: true,
          },

          {
            name: "title",
            type: "varchar",
            length: "120",
          },

          {
            name: "description",
            type: "text",
            isNullable: true,
          },

          {
            name: "type",
            type: "enum",
            enum: ["wedding", "birthday", "graduation", "anniversary", "naming", "other"],
            default: "'other'",
          },

          {
            name: "status",
            type: "enum",
            enum: ["draft", "active", "ended", "cancelled"],
            default: "'draft'",
          },

          {
            name: "hostId",
            type: "uuid",
          },

          {
            name: "venue",
            type: "varchar",
            length: "200",
            isNullable: true,
          },

          {
            name: "startsAt",
            type: "timestamptz",
          },

          {
            name: "endsAt",
            type: "timestamptz",
          },

          {
            name: "tokenBalance",
            type: "bigint",
            default: 0,
          },

          {
            name: "nairaBalance",
            type: "bigint",
            default: 0,
          },

          {
            name: "giftCount",
            type: "int",
            default: 0,
          },

          {
            name: "gifterCount",
            type: "int",
            default: 0,
          },

          {
            name: "tokenRateNaira",
            type: "int",
            default: 10,
          },

          {
            name: "showNairaValues",
            type: "boolean",
            default: true,
          },

          {
            name: "coverImageUrl",
            type: "varchar",
            isNullable: true,
          },

          {
            name: "welcomeMessage",
            type: "text",
            isNullable: true,
          },

          {
            name: "createdAt",
            type: "timestamptz",
            default: "now()",
          },

          {
            name: "updatedAt",
            type: "timestamptz",
            default: "now()",
          },
        ],
      })
    );

    // ─── Indexes ─────────────────────────────

    await queryRunner.createIndex(
      "events",
      new TableIndex({
        name: "IDX_events_hostId_status",
        columnNames: ["hostId", "status"],
      })
    );

    await queryRunner.createIndex(
      "events",
      new TableIndex({
        name: "IDX_events_slug",
        columnNames: ["slug"],
        isUnique: true,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("events");
  }
}