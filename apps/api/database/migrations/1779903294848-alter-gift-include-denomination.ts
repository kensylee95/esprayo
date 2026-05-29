import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
} from "typeorm";

export class AlterGiftIncludeDenomination1779903294848
  implements MigrationInterface
{
  public async up(
    queryRunner: QueryRunner
  ): Promise<void> {

    // -------------------------
    // REMOVE OLD OBSOLETE COLUMNS
    // -------------------------

    await queryRunner.dropColumn(
      "gifts",
      "giftId"
    );

    await queryRunner.dropColumn(
      "gifts",
      "giftName"
    );

    await queryRunner.dropColumn(
      "gifts",
      "giftEmoji"
    );

    await queryRunner.dropColumn(
      "gifts",
      "tokens"
    );

    // -------------------------
    // ADD NEW COLUMNS
    // -------------------------

    await queryRunner.addColumns(
      "gifts",
      [
        new TableColumn({
          name: "denomination",
          type: "varchar",
          length: "50",
          isNullable: false,
          default: "'1000'",
        }),

        new TableColumn({
          name: "quantity",
          type: "int",
          default: 1,
        }),

        new TableColumn({
          name: "giftType",
          type: "varchar",
          length: "50",
          default: "'spray'",
        }),

        new TableColumn({
          name: "currency",
          type: "varchar",
          length: "10",
          default: "'NGN'",
        }),

        new TableColumn({
          name: "metadata",
          type: "jsonb",
          isNullable: true,
        }),
      ]
    );
  }

  public async down(
    queryRunner: QueryRunner
  ): Promise<void> {

    // -------------------------
    // REMOVE NEW COLUMNS
    // -------------------------

    await queryRunner.dropColumn(
      "gifts",
      "metadata"
    );

    await queryRunner.dropColumn(
      "gifts",
      "currency"
    );

    await queryRunner.dropColumn(
      "gifts",
      "giftType"
    );

    await queryRunner.dropColumn(
      "gifts",
      "quantity"
    );

    await queryRunner.dropColumn(
      "gifts",
      "denomination"
    );

    // -------------------------
    // RESTORE OLD COLUMNS
    // -------------------------

    await queryRunner.addColumns(
      "gifts",
      [
        new TableColumn({
          name: "giftId",
          type: "varchar",
          length: "40",
        }),

        new TableColumn({
          name: "giftName",
          type: "varchar",
          length: "80",
        }),

        new TableColumn({
          name: "giftEmoji",
          type: "varchar",
          length: "10",
        }),

        new TableColumn({
          name: "tokens",
          type: "int",
        }),
      ]
    );
  }
}