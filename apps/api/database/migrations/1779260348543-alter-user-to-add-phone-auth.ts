import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AlterUserToAddPhoneAuth1779260348543 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.changeColumn(
      'users',
      'email',
      new TableColumn({
        name: 'email',
        type: 'varchar',
        isUnique: true,
        isNullable: true,
      }),
    );

    await queryRunner.changeColumn(
      'users',
      'first_name',
      new TableColumn({
        name: 'first_name',
        type: 'varchar',
        isNullable: true,
      }),
    );

    await queryRunner.changeColumn(
      'users',
      'last_name',
      new TableColumn({
        name: 'last_name',
        type: 'varchar',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'phone',
        type: 'varchar',
        isUnique: true,
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('users', 'phone');

    await queryRunner.changeColumn(
      'users',
      'first_name',
      new TableColumn({
        name: 'first_name',
        type: 'varchar',
        isNullable: false,
      }),
    );

    await queryRunner.changeColumn(
      'users',
      'last_name',
      new TableColumn({
        name: 'last_name',
        type: 'varchar',
        isNullable: false,
      }),
    );

    await queryRunner.changeColumn(
      'users',
      'email',
      new TableColumn({
        name: 'email',
        type: 'varchar',
        isUnique: true,
        isNullable: false,
      }),
    );
  }
}