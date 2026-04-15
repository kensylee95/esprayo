import { DataSource } from 'typeorm';
import 'tsconfig-paths/register';
export const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT as string, 10),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  ssl: process.env.DB_SSL?.trim().toLowerCase() === 'true',
  schema: 'public',
   migrations: ['database/migrations/*.ts'],
  entities: [__dirname + '/../../**/*.entity{.ts,.js}'],
});
