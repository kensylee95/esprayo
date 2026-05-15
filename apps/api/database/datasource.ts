import { DataSource } from 'typeorm';
import 'tsconfig-paths/register';
export const dataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: ['apps/**/*.entity{.ts,.js}'],
  migrations: ['database/migrations/*.ts'],
});
